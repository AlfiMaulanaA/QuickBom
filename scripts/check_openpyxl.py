try:
    import openpyxl
    print("OPENPYXL SUCCESS")
except ImportError as e:
    print(f"OPENPYXL FAILED: {e}")
