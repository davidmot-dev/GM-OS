import sys
import os

# Get user home directory for portability
USER_HOME = os.path.expanduser("~")
ANTIGRAVITY_DIR = os.path.join(USER_HOME, ".antigravity", "notebooklm-mcp")

# Log startup for debug
with open(os.path.join(ANTIGRAVITY_DIR, "startup_test.txt"), "w") as f:
    f.write("Python started successfully\n")

# Set all necessary environment variables internally
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["PYTHONWARNINGS"] = "ignore"
os.environ["NOTEBOOKLM_BL"] = "boq_labs-tailwind-frontend_20260416.03_p0"
os.environ["FASTMCP_SHOW_SERVER_BANNER"] = "false"
os.environ["FASTMCP_CHECK_FOR_UPDATES"] = "off"
os.environ["NOTEBOOKLM_CONFIG"] = os.path.join(ANTIGRAVITY_DIR, "notebooklm-config.json")

# In a portable setup, we assume python is in PATH and site-packages are managed
# We don't append specific david paths anymore.

def cleanup_orphans():
    """Kill orphan chrome processes that might lock the profile"""
    if os.name == 'nt':
        import subprocess
        try:
            subprocess.run(['taskkill', '/F', '/IM', 'chromedriver.exe', '/T'], capture_output=True)
        except Exception:
            pass

if __name__ == "__main__":
    cleanup_orphans()
    
    # Check if a specific module is requested
    module_to_run = "server"
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        module_to_run = sys.argv[1]
        sys.argv.pop(1)
    
    try:
        # These modules should be installed in the python environment
        if module_to_run == "auth_cli":
            from notebooklm_mcp.auth_cli import main
        else:
            from notebooklm_mcp.server import main
        main()
    except Exception as e:
        sys.stderr.write(f"FATAL ERROR in {module_to_run}: {e}\n")
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
