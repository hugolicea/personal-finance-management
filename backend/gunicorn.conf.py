bind = "0.0.0.0:8000"
workers = 4
timeout = 60
accesslog = "-"
errorlog = "-"
# %(t)s = timestamp, %(m)s = method, %(U)s = path, %(q)s = ?query (empty if none),
# %(s)s = status code, %(b)s = bytes, %(L)s = request time in seconds
access_log_format = "%(t)s %(m)s %(U)s%(q)s %(s)s %(b)sB %(Ls)ss"
