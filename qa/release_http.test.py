import unittest
from unittest.mock import patch, call
from urllib.error import HTTPError
from urllib.request import Request
from release_http import open_public


class ReleaseHTTP(unittest.TestCase):
    def setUp(self):
        self.request = Request('https://example.invalid/site/')

    def error(self, status):
        return HTTPError(self.request.full_url, status, 'test response', {}, None)

    @patch('release_http.time.sleep')
    @patch('release_http.urlopen')
    def test_success_needs_no_retry(self, opener, sleep):
        expected = object()
        opener.return_value = expected
        self.assertIs(open_public(self.request), expected)
        opener.assert_called_once_with(self.request, timeout=20)
        sleep.assert_not_called()

    @patch('release_http.time.sleep')
    @patch('release_http.urlopen')
    def test_temporary_503_recovers(self, opener, sleep):
        expected = object()
        opener.side_effect = [self.error(503), expected]
        self.assertIs(open_public(self.request), expected)
        self.assertEqual(opener.call_count, 2)
        sleep.assert_called_once_with(1)

    @patch('release_http.time.sleep')
    @patch('release_http.urlopen')
    def test_persistent_503_fails_after_three_attempts(self, opener, sleep):
        opener.side_effect = self.error(503)
        with self.assertRaises(HTTPError):
            open_public(self.request)
        self.assertEqual(opener.call_count, 3)
        self.assertEqual(sleep.call_args_list, [call(1), call(2)])

    @patch('release_http.time.sleep')
    @patch('release_http.urlopen')
    def test_missing_file_fails_immediately(self, opener, sleep):
        opener.side_effect = self.error(404)
        with self.assertRaises(HTTPError):
            open_public(self.request)
        self.assertEqual(opener.call_count, 1)
        sleep.assert_not_called()

    @patch('release_http.time.sleep')
    @patch('release_http.urlopen')
    def test_rate_limit_is_not_retried(self, opener, sleep):
        opener.side_effect = self.error(429)
        with self.assertRaises(HTTPError):
            open_public(self.request)
        self.assertEqual(opener.call_count, 1)
        sleep.assert_not_called()


if __name__ == '__main__':
    unittest.main()
