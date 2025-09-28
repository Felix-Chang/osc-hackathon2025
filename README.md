# PosturePal — osc-hackathon2025 
A fast prototype built during the UF Open Source Club Hackathon 2025. Clone the repo, create a virtual environment, and install dependencies to reproduce our setup.

## Quick Start

### 1) Clone and enter
```bash
git clone https://github.com/Felix-Chang/osc-hackathon2025.git
cd osc-hackathon2025
```

### 2) Download the 3.11.0 version of Python for your device (macOS/Windows)

```
https://www.python.org/downloads/release/python-3110/
```

### 3) Create & activate a virtual environment using the 3.11.0 Python version

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
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4) Run (example)
```
python getdata.py
```
