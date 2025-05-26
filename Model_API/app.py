from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans, HDBSCAN
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.decomposition import PCA
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re
from urllib.parse import urlparse
import uvicorn
import rake_nltk
import umap
import logging
import torch
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

app = FastAPI()

# Add CORS middleware to allow requests from any client (public API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for public access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize transformer model
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")
transformer_model = SentenceTransformer("all-distilroberta-v1", device=device)

stop_words = set(stopwords.words('english'))
# Add domain-specific stopwords
stop_words.update(['www', 'http', 'https', 'com', 'org', 'net', 'en', 'unit', 'page', 'index'])

rake = rake_nltk.Rake()

# --------------- Models ---------------

class Tab(BaseModel):
    url: str
    title: str

class Settings(BaseModel):
    similarityThreshold: float = 0.5
    minWorkspaceSize: int = 2
    autoGroupTabs: bool = True
    namingStrategy: str = "keyword"
    tabSource: str = "current-window"
    numClusters: int = 3
    minClusterSize: int = 3
    domainWeight: float = 0.4
    pathWeight: float = 0.3
    titleWeight: float = 0.3

class ClusterResult(BaseModel):
    groups: List[Dict[str, Any]]
    metrics: Dict[str, float]
    algorithm: str

class GroupTabsRequest(BaseModel):
    tabs: List[Tab]
    settings: Settings

# --------------- Helper Functions ---------------

def clean_text(text: str) -> str:
    """Normalize text using NLTK for tokenization and stopword removal."""
    if not isinstance(text, str) or not text.strip():
        return ""
    # Remove numbers and special characters
    text = re.sub(r'[^a-zA-Z\s]', '', text.lower())
    tokens = word_tokenize(text)
    tokens = [token for token in tokens if token not in stop_words and len(token) > 3]
    return " ".join(tokens)

def embed_tabs(tabs: List[Tab], settings: Settings) -> tuple[np.ndarray, List[str]]:
    """Extract features using Sentence-BERT embeddings with weighted components."""
    documents = []
    for tab in tabs:
        url = urlparse(tab.url)
        domain = clean_text(url.netloc.replace("www.", "") if url.netloc else "")
        path = clean_text(url.path if url.path else "")
        title = clean_text(tab.title)

        domain_repeats = max(1, int(settings.domainWeight * 10))
        path_repeats = max(1, int(settings.pathWeight * 10))
        title_repeats = max(1, int(settings.titleWeight * 10))

        document_parts = (
            [domain] * domain_repeats +
            [path] * path_repeats +
            [title] * title_repeats
        )
        documents.append(" ".join(document_parts))

    embeddings = transformer_model.encode(documents, batch_size=32, convert_to_numpy=True, normalize_embeddings=True)
    
    # Log the number of tabs
    logger.info(f"Number of tabs: {len(embeddings)}")
    
    # Apply dimensionality reduction if enough data points
    if len(embeddings) >= 10:  # Only apply UMAP if we have at least 10 tabs
        # Dynamically adjust n_components and n_neighbors
        n_components = min(len(embeddings) - 1, 30)
        n_neighbors = min(3, len(embeddings) - 1)  # Reduce n_neighbors for small datasets
        logger.info(f"Applying UMAP with n_components={n_components}, n_neighbors={n_neighbors}")
        reducer = umap.UMAP(n_components=n_components, n_neighbors=n_neighbors, metric='cosine', random_state=42)
        embeddings = reducer.fit_transform(embeddings)
    elif len(embeddings) >= 2:  # Use PCA for small datasets (2-9 tabs)
        logger.info("Using PCA for small dataset")
        n_components = min(len(embeddings) - 1, 30)
        reducer = PCA(n_components=n_components)
        embeddings = reducer.fit_transform(embeddings)
    # If only 1 tab, skip dimensionality reduction
    
    return embeddings, documents

def find_optimal_k(embeddings: np.ndarray, max_k: int = 10) -> int:
    """Find the optimal number of clusters for K-Means using silhouette score."""
    if len(embeddings) < 2:
        return 2
    max_k = min(max_k, len(embeddings) - 1)
    best_k = 2
    best_score = -1
    for k in range(2, max_k + 1):
        kmeans = KMeans(n_clusters=k, init='k-means++', max_iter=100, random_state=42)
        labels = kmeans.fit_predict(embeddings)
        if len(set(labels)) > 1:
            score = silhouette_score(embeddings, labels, metric='cosine')
            if score > best_score:
                best_score = score
                best_k = k
    return best_k

def cluster_tabs(embeddings: np.ndarray, settings: Settings, algorithm: str) -> tuple[List[int], Dict[str, float]]:
    """Cluster tabs using the specified algorithm and return labels and metrics."""
    if embeddings.size == 0:
        return [-1] * len(embeddings), {"silhouette_score": 0.0, "davies_bouldin": 0.0, "calinski_harabasz": 0.0, "num_clusters": 0, "noise_points": 0}

    if np.unique(embeddings, axis=0).shape[0] == 1:
        return [-1] * len(embeddings), {"silhouette_score": 0.0, "davies_bouldin": 0.0, "calinski_harabasz": 0.0, "num_clusters": 0, "noise_points": len(embeddings)}

    if algorithm == "kmeans":
        # Dynamically find the optimal number of clusters
        num_clusters = find_optimal_k(embeddings, max_k=settings.numClusters)
        clusterer = KMeans(n_clusters=num_clusters, init='k-means++', max_iter=100, random_state=42)
        labels = clusterer.fit_predict(embeddings)
    elif algorithm == "hdbscan":
        clusterer = HDBSCAN(
            min_cluster_size=max(settings.minClusterSize, settings.minWorkspaceSize),
            metric='cosine',
            cluster_selection_epsilon=0.3
        )
        labels = clusterer.fit_predict(embeddings)
    else:
        raise ValueError(f"Unsupported clustering algorithm: {algorithm}")

    metrics = {}
    unique_labels = set(labels) - {-1}
    
    # Silhouette Score
    silhouette = 0.0
    if len(unique_labels) > 1 and len(embeddings) > len(unique_labels):
        silhouette = silhouette_score(embeddings, labels, metric='cosine')
    metrics["silhouette_score"] = silhouette

    # Davies-Bouldin Index
    db_index = 0.0
    if len(unique_labels) > 1 and len(embeddings) > len(unique_labels):
        db_index = davies_bouldin_score(embeddings, labels)
    metrics["davies_bouldin"] = db_index

    # Calinski-Harabasz Index
    ch_index = 0.0
    if len(unique_labels) > 1 and len(embeddings) > len(unique_labels):
        ch_index = calinski_harabasz_score(embeddings, labels)
    metrics["calinski_harabasz"] = ch_index

    # Number of Clusters
    num_clusters = len(unique_labels)
    metrics["num_clusters"] = num_clusters

    # Noise Points (HDBSCAN-specific)
    noise_points = list(labels).count(-1)
    metrics["noise_points"] = noise_points

    logger.info(f"Algorithm: {algorithm}, Silhouette: {silhouette:.3f}, "
                f"Davies-Bouldin: {db_index:.3f}, Calinski-Harabasz: {ch_index:.3f}")

    return labels, metrics

def generate_group_name(group_tabs: List[Tab], strategy: str, documents: List[str]) -> str:
    """Generate a name for the cluster based on the naming strategy."""
    if strategy == "keyword":
        texts = [doc for tab, doc in zip(group_tabs, documents) if tab in group_tabs]
        if texts:
            rake.extract_keywords_from_text(" ".join(texts))
            keywords = rake.get_ranked_phrases()[:3]
            return ", ".join(keywords) if keywords else "Workspace"
    elif strategy == "domain":
        domains = [urlparse(tab.url).netloc.replace("www.", "") for tab in group_tabs]
        common_domain = max(set(domains), key=domains.count, default="Workspace")
        return common_domain
    elif strategy == "domain-word":
        domains = [urlparse(tab.url).netloc.replace("www.", "") for tab in group_tabs]
        common_domain = max(set(domains), key=domains.count, default="Workspace")
        return common_domain
    elif strategy == "auto-numbered":
        texts = [doc for tab, doc in zip(group_tabs, documents) if tab in group_tabs]
        if texts:
            rake.extract_keywords_from_text(" ".join(texts))
            keywords = rake.get_ranked_phrases()[:1]
            return f"Group {np.random.randint(1000, 9999)} - {keywords[0]}" if keywords else f"Group {np.random.randint(1000, 9999)}"
    return "Workspace"

def compute_composite_score(metrics: Dict[str, float], num_tabs: int) -> float:
    """Compute a composite score from clustering metrics."""
    # Normalize metrics
    # Silhouette Score: -1 to 1 -> 0 to 1
    silhouette_norm = (metrics["silhouette_score"] + 1) / 2
    
    # Davies-Bouldin: 0 to infinity (assume max 5) -> 0 to 1 (lower is better)
    db_max = 5.0
    db_norm = 1 - min(metrics["davies_bouldin"] / db_max, 1)
    
    # Calinski-Harabasz: 0 to infinity (assume max 100) -> 0 to 1
    ch_max = 100.0
    ch_norm = min(metrics["calinski_harabasz"] / ch_max, 1)
    
    # Number of Clusters: Target 2-5 -> 0 to 1
    target_clusters = 3.5  # Midpoint of 2-5
    cluster_range = 1.5  # Distance from 3.5 to 2 or 5
    clusters_norm = 1 - abs(metrics["num_clusters"] - target_clusters) / cluster_range
    clusters_norm = max(0, min(clusters_norm, 1))  # Clamp to 0-1
    
    # Noise Points: 0 to num_tabs -> 0 to 1 (lower is better)
    noise_norm = 1 - metrics["noise_points"] / num_tabs if num_tabs > 0 else 1.0
    
    # Weights
    weights = {
        "silhouette": 0.4,
        "davies_bouldin": 0.2,
        "calinski_harabasz": 0.2,
        "num_clusters": 0.1,
        "noise_points": 0.1
    }
    
    # Compute composite score
    composite = (
        weights["silhouette"] * silhouette_norm +
        weights["davies_bouldin"] * db_norm +
        weights["calinski_harabasz"] * ch_norm +
        weights["num_clusters"] * clusters_norm +
        weights["noise_points"] * noise_norm
    )
    
    # Log normalized scores for debugging
    logger.info(f"Normalized scores: silhouette={silhouette_norm:.3f}, davies_bouldin={db_norm:.3f}, "
                f"calinski_harabasz={ch_norm:.3f}, num_clusters={clusters_norm:.3f}, noise_points={noise_norm:.3f}")
    logger.info(f"Composite score: {composite:.3f}")
    
    return composite

# --------------- API Route ---------------

@app.post("/group-tabs", response_model=ClusterResult)
async def group_tabs(req: GroupTabsRequest):
    tabs = req.tabs
    settings = req.settings

    if not tabs:
        return {"groups": [], "metrics": {"silhouette_score": 0.0, "davies_bouldin": 0.0, "calinski_harabasz": 0.0, "num_clusters": 0, "noise_points": 0}, "algorithm": ""}

    # Filter invalid tabs
    valid_tabs = [tab for tab in tabs if tab.url and not any(
        tab.url.startswith(prefix) for prefix in ["chrome://", "chrome-extension://", "moz-extension://", "about:"])]

    if not valid_tabs:
        return {"groups": [], "metrics": {"silhouette_score": 0.0, "davies_bouldin": 0.0, "calinski_harabasz": 0.0, "num_clusters": 0, "noise_points": 0}, "algorithm": ""}

    # Generate embeddings with weights
    embeddings, documents = embed_tabs(valid_tabs, settings)

    # Run K-Means and HDBSCAN
    results = []
    for algorithm in ["kmeans", "hdbscan"]:
        labels, metrics = cluster_tabs(embeddings, settings, algorithm)
        
        # Group tabs by cluster
        clustered = {}
        for label, tab in zip(labels, valid_tabs):
            if label != -1:  # Exclude noise points (HDBSCAN)
                clustered.setdefault(label, []).append(tab)
        
        groups = []
        for group_tabs in clustered.values():
            if len(group_tabs) >= settings.minWorkspaceSize:
                name = generate_group_name(group_tabs, settings.namingStrategy, documents)
                groups.append({
                    "name": name,
                    "tabs": [tab.dict() for tab in group_tabs]
                })
        
        # Compute composite score
        composite_score = compute_composite_score(metrics, len(valid_tabs))
        
        results.append({
            "groups": groups,
            "metrics": metrics,
            "algorithm": algorithm,
            "composite_score": composite_score
        })

    # Select best result based on composite score
    best_result = max(results, key=lambda x: x["composite_score"], default=results[0])
    logger.info(f"Selected algorithm: {best_result['algorithm']} with composite score: {best_result['composite_score']:.3f}")

    return best_result

# --------------- Start Server ---------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))  # Use PORT env variable, default to 8000
    uvicorn.run(app, host="0.0.0.0", port=port)  # Remove reload=True for production