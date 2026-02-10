import os
import sys
import time
import threading
import socket
from datetime import datetime

# Add current dir to path to find local 'swarm' package
sys.path.append(os.getcwd())

from swarm.context.context_summarizer import ContextSummarizer
from swarm.context.dependency_graph import DependencyMapper
from swarm.context.context_validator import ContextValidator

class SystemHealthCheck:
    def __init__(self):
        self.targets = {
            "Backend (API)": 3000,
            "Frontend (Vite)": 5173
        }

    def check_port(self, host, port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            try:
                s.connect((host, port))
                return True
            except:
                return False

    def report_status(self):
        print(f"\n[STAMP] {datetime.now().strftime('%H:%M:%S')} - Sentinel Health Check")
        for name, port in self.targets.items():
            is_up = self.check_port('localhost', port)
            status = "🟢 ACTIVE" if is_up else "🔴 DOWN"
            print(f"  {name}: {status} (Port {port})")

class CaribeSentinel:
    def __init__(self, watch_dir):
        self.watch_dir = watch_dir
        self.summarizer = ContextSummarizer(watch_dir)
        self.mapper = DependencyMapper(watch_dir)
        self.validator = ContextValidator(watch_dir)
        self.health = SystemHealthCheck()
        self.running = True

    def monitor_health(self):
        while self.running:
            self.health.report_status()
            time.sleep(60)

    def run(self):
        print(f"📡 Caribe Sentinel Active: Monitoring {self.watch_dir}")
        
        # Start health monitoring in a separate thread
        health_thread = threading.Thread(target=self.monitor_health, daemon=True)
        health_thread.start()

        try:
            while self.running:
                # Check for drift
                stale = self.validator.find_stale_files()
                if stale:
                    print(f"Found {len(stale)} stale files. Regenerating Knowledge Map...")
                    self.summarizer.generate_map()
                    self.mapper.build_graph()
                
                # Check integrity
                self.validator.check_integrity()
                time.sleep(300) # Full integrity scan every 5 minutes
                
        except KeyboardInterrupt:
            print("\nShutting down Sentinel...")
            self.running = False
        except Exception as e:
            print(f"Sentinel Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    target = r"C:\Users\edmoq\Documents\caribe digital CR"
    sentinel = CaribeSentinel(target)
    sentinel.run()
