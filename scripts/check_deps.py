try:
    import pandas as pd
    import openpyxl
    print("SUCCESS")
except ImportError as e:
    print(f"FAILED: {e}")
