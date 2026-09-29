#!/usr/bin/env python3
"""Minimal static file server for the Ascend study app.

Deliberately avoids python -m http.server's CLI entry point, which calls
os.getcwd() while building its argument parser (even when --directory is
passed) - that call is blocked in some sandboxed launchers. This script
binds the serving directory explicitly and never touches the cwd.
"""
import functools
import http.server
import os
import socketserver

PORT = int(os.environ.get("PORT", "8721"))
# Hardcoded (not derived via os.path.abspath/getcwd) so this never trips the
# same getcwd() sandbox restriction this script exists to work around.
DIRECTORY = "/Users/pmoit/Documents/study-aws"

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {DIRECTORY} at http://localhost:{PORT}")
        httpd.serve_forever()
