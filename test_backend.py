"""
Comprehensive Backend Test Suite for Korean Mastery Platform
"""

import unittest
import json
import os
import time
import backend

class TestKoreanMasteryBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use a temporary test database
        cls.test_db = os.path.join(backend.BASE_DIR, 'test_korean_mastery.db')
        backend.SQLITE_DB_PATH = cls.test_db
        if os.path.exists(cls.test_db):
            os.remove(cls.test_db)
        backend.init_db()
        backend.app.config['TESTING'] = True
        cls.client = backend.app.test_client()

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_db):
            os.remove(cls.test_db)

    def test_01_health(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'healthy')

    def test_02_registration_and_login(self):
        res = self.client.post('/api/auth/register', json={
            'email': 'student1@example.com',
            'password': 'password123',
            'full_name': 'Emeka Obi'
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertIn('token', data)
        self.assertEqual(data['user']['tier'], 1)

        # Login
        res_login = self.client.post('/api/auth/login', json={
            'email': 'student1@example.com',
            'password': 'password123'
        })
        self.assertEqual(res_login.status_code, 200)
        login_data = json.loads(res_login.data)
        self.assertIn('token', login_data)

    def test_03_payment_and_idempotency(self):
        res = self.client.post('/api/auth/register', json={
            'email': 'payer1@example.com',
            'password': 'password123',
            'full_name': 'Fatima Aliyu'
        })
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        token = data['token']
        headers = {'Authorization': f'Bearer {token}'}

        # Initialize Paystack payment for Tier 2 (₦500 -> 50000 kobo)
        res_init = self.client.post('/api/paystack/initialize', headers=headers, json={'tier': 2})
        self.assertEqual(res_init.status_code, 200)
        init_data = json.loads(res_init.data)
        ref = init_data['reference']
        self.assertEqual(init_data['amount_kobo'], 50000)

        # Verify Payment
        res_verify = self.client.post('/api/paystack/verify', headers=headers, json={'reference': ref, 'tier': 2})
        self.assertEqual(res_verify.status_code, 200)
        v_data = json.loads(res_verify.data)
        self.assertEqual(v_data['tier'], 2)

        # Check /api/auth/me reflects tier 2
        res_me = self.client.get('/api/auth/me', headers=headers)
        me_data = json.loads(res_me.data)
        self.assertEqual(me_data['user']['tier'], 2)

        # Upgrade to Tier 3 (₦2000 -> 200000 kobo)
        res_init3 = self.client.post('/api/paystack/initialize', headers=headers, json={'tier': 3})
        ref3 = json.loads(res_init3.data)['reference']
        res_verify3 = self.client.post('/api/paystack/verify', headers=headers, json={'reference': ref3, 'tier': 3})
        self.assertEqual(json.loads(res_verify3.data)['tier'], 3)

        # Re-fulfilling a Tier 2 reference should never downgrade Tier 3 user
        success, msg, tier = backend.fulfill_payment('payer1@example.com', ref, 50000, 2)
        self.assertTrue(success)
        self.assertEqual(tier, 3)

    def test_04_certificate_generation(self):
        res = self.client.post('/api/auth/register', json={
            'email': 'scholar1@example.com',
            'password': 'password123',
            'full_name': 'Chinedu Eze'
        })
        self.assertEqual(res.status_code, 201)
        token = json.loads(res.data)['token']
        headers = {'Authorization': f'Bearer {token}'}

        # Upgrade to Tier 3
        backend.fulfill_payment('scholar1@example.com', 'REF-SCHOLAR-99', 200000, 3)

        # Generate Certificate
        res_cert = self.client.post('/api/certificate/generate', headers=headers)
        self.assertEqual(res_cert.status_code, 200)
        cdata = json.loads(res_cert.data)
        cert_code = cdata['cert_code']
        self.assertTrue(cert_code.startswith('KM-NG-'))

        # Public verification
        res_ver = self.client.get(f'/api/certificate/verify/{cert_code}')
        self.assertEqual(res_ver.status_code, 200)
        vdata = json.loads(res_ver.data)
        self.assertEqual(vdata['status'], 'verified')
        self.assertEqual(vdata['student_name'], 'Chinedu Eze')

        # Download certificate
        res_down = self.client.get(f'/api/certificate/download/{cert_code}')
        self.assertEqual(res_down.status_code, 200)

    def test_05_security_and_404(self):
        self.assertEqual(self.client.get('/backend.py').status_code, 404)
        self.assertEqual(self.client.get('/korean_mastery.db').status_code, 404)
        self.assertEqual(self.client.get('/.env').status_code, 404)

if __name__ == '__main__':
    unittest.main()
