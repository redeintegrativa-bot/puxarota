import http.server
import functools

PORT = 4100


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args))


with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=".")) as httpd:
    print("Servindo no-store em http://127.0.0.1:%d/" % PORT)
    httpd.serve_forever()
