import unittest
from estimator import estimate_next_period

class EstimatorTests(unittest.TestCase):
    def test_one_cycle_is_insufficient(self):
        self.assertEqual(estimate_next_period(["2026-01-01"])["status"],"insufficient")

    def test_two_starts_is_insufficient(self):
        self.assertEqual(estimate_next_period(["2026-01-01","2026-01-29"])["status"],"insufficient")

    def test_consistent_history_returns_range(self):
        r=estimate_next_period(["2026-01-01","2026-01-29","2026-02-26","2026-03-26","2026-04-23"])
        self.assertEqual(r["status"],"ok")
        self.assertEqual(r["average_cycle_length"],28.0)
        self.assertLess(r["estimated_start"],r["estimated_end"])

    def test_variable_history_widens_range(self):
        stable=estimate_next_period(["2026-01-01","2026-01-29","2026-02-26","2026-03-26","2026-04-23"])
        variable=estimate_next_period(["2026-01-01","2026-01-25","2026-02-26","2026-03-22","2026-04-25"])
        self.assertGreaterEqual(variable["range_half_width_days"],stable["range_half_width_days"])

    def test_bad_interval_is_excluded(self):
        r=estimate_next_period(["2026-01-01","2026-01-03","2026-01-31","2026-02-28","2026-03-28"])
        self.assertIn(2,r["excluded_cycle_lengths"])

    def test_duplicate_and_bad_dates_do_not_crash(self):
        r=estimate_next_period(["bad","2026-01-01","2026-01-01","2026-01-29","2026-02-26"])
        self.assertEqual(r["status"],"ok")

if __name__=="__main__":
    unittest.main()
