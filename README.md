# osc-hackathon2025
A fast prototype built during Open Source Hackathon 2025. Clone the repo, create a virtual environment, and install dependencies to reproduce our setup.

## Quick Start

### 1) Clone and enter
```bash
git clone --branch blankFrontend --single-branch https://github.com/Felix-Chang/osc-hackathon2025.git
cd osc-hackathon2025
```

### 2) Create & activate a virtual environment

**Windows (CMD)**
```cmd
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Windows (PowerShell)**
```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux**
```bash
python3 -3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3) Run (example)
```bash
python getdata.py
# or: python -m src.main
```
