# GeoInsight.AI Backend

A Python-based backend service for GeoInsight.AI, providing document processing, retrieval, and AI-powered insights using LangChain and various AI models.

## 🚀 Quick Start with uv

### Prerequisites

- Python 3.8 or higher
- [uv](https://docs.astral.sh/uv/) - Fast Python package installer and resolver

### Installation

1. **Install uv** (if not already installed):
   ```bash
   # Windows
   pip install uv

   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Clone and navigate to backend**:
   ```bash
   git clone <repository-url>
   cd GeoInsight.AI/backend
   ```

3. **Create virtual environment and install dependencies**:
   ```bash
   uv venv
   uv pip install -r requirements.txt
   ```

4. **Activate virtual environment**:
   ```bash
   # Windows
   .venv\Scripts\activate

   # macOS/Linux
   source .venv/bin/activate
   ```

```
backend/
├── config/           # Configuration files
├── data/            # Data storage
├── exception/       # Custom exception handling
├── logger/          # Logging configuration
├── model/           # Data models
├── notebook/        # Jupyter notebooks for experiments
├── prompt/          # Prompt templates and libraries
├── src/             # Source code
├── utils/           # Utility functions
├── requirements.txt  # Python dependencies
└── setup.py         # Package setup
```