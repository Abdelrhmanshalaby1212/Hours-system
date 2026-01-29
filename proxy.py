from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import sys

TARGET = "http://h-m-s.runasp.net"
PORT = 5000

class ProxyHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def _proxy(self, method):
        url = TARGET + self.path
        body = None
        if method in ("POST", "PUT"):
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else None

        headers = {}
        ct = self.headers.get("Content-Type")
        if ct:
            headers["Content-Type"] = ct

        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self._set_cors_headers()
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self._set_cors_headers()
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.end_headers()
            self.wfile.write(data)

    def do_GET(self): self._proxy("GET")
    def do_POST(self): self._proxy("POST")
    def do_PUT(self): self._proxy("PUT")
    def do_DELETE(self): self._proxy("DELETE")

print(f"CORS proxy running on http://localhost:{PORT} -> {TARGET}")
HTTPServer(("", PORT), ProxyHandler).serve_forever()
