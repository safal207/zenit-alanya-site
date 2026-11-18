"""Bounded retry for temporary GitHub Pages responses; validation stays strict."""
from urllib.error import HTTPError
from urllib.request import urlopen
import time


def open_public(request):
    for attempt in range(3):
        try:
            return urlopen(request, timeout=20)
        except HTTPError as error:
            if error.code not in (500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(attempt + 1)

