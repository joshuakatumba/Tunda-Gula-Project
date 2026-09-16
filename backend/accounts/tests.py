from unittest.mock import patch
from datetime import timedelta
# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from django.urls import reverse
# pyrefly: ignore [missing-import]
from django.utils import timezone
# pyrefly: ignore [missing-import]
from rest_framework.test import APITestCase
# pyrefly: ignore [missing-import]
from rest_framework import status
from accounts.models import User, OTP
from accounts.utils import clean_phone


class AccountModelTests(TestCase):
    """Tests verifying distinct account structures for Buyers, Farmers, and Staff."""

    def test_create_buyer(self):
        buyer = User.objects.create_user(
            phone="+256780111222",
            role=User.Role.BUYER,
            name="Sarah Namubiru",
            buyer_type=User.BuyerType.HOUSEHOLD,
            district="Wakiso",
        )
        self.assertEqual(buyer.role, "buyer")
        self.assertTrue(buyer.is_buyer)
        self.assertFalse(buyer.is_farmer)
        self.assertFalse(buyer.is_staff_member)
        self.assertEqual(buyer.buyer_type, "household")

    def test_create_farmer(self):
        farmer = User.objects.create_user(
            phone="+256770333444",
            role=User.Role.SELLER,
            name="Musa Kato",
            seller_type=User.SellerType.SMALLHOLDER,
            district="Mukono",
            nin="CM8501234XYZ5A",
            manual_location="Nama sub-county, near church",
            gps_lat=0.3541,
            gps_lng=32.7523,
        )
        self.assertEqual(farmer.role, "seller")
        self.assertTrue(farmer.is_farmer)
        self.assertFalse(farmer.is_buyer)
        self.assertFalse(farmer.is_staff_member)
        self.assertEqual(farmer.nin, "CM8501234XYZ5A")
        self.assertEqual(farmer.district, "Mukono")

    def test_create_staff(self):
        staff = User.objects.create_superuser(
            phone="+256700555666",
            role=User.Role.ADMIN,
            name="Tunda Admin",
            password="securepassword123",
        )
        self.assertEqual(staff.role, "admin")
        self.assertTrue(staff.is_staff_member)
        self.assertTrue(staff.is_staff)
        self.assertTrue(staff.is_superuser)
        self.assertFalse(staff.is_farmer)
        self.assertFalse(staff.is_buyer)

    def test_accounts_persist_in_database(self):
        phone = "+256779999000"
        User.objects.create_user(
            phone=phone,
            role=User.Role.BUYER,
            name="Grace Auma",
            buyer_type=User.BuyerType.RESTAURANT,
        )
        saved_user = User.objects.get(phone=phone)
        self.assertEqual(saved_user.name, "Grace Auma")
        self.assertEqual(saved_user.buyer_type, "restaurant")

    def test_otp_model_helpers(self):
        valid_otp = OTP.objects.create(
            phone="+256771111222",
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        self.assertTrue(valid_otp.is_valid)
        self.assertFalse(valid_otp.is_expired)

        expired_otp = OTP.objects.create(
            phone="+256771111333",
            code="654321",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        self.assertTrue(expired_otp.is_expired)
        self.assertFalse(expired_otp.is_valid)


class AccountRegistrationAPITests(APITestCase):
    """Tests verifying registration validation and role enforcement behind verified OTP."""

    def create_verified_otp(self, phone):
        formatted_phone = clean_phone(phone)
        return OTP.objects.create(
            phone=formatted_phone,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
            is_used=True,
            status=OTP.Status.VERIFIED,
        )

    def test_registration_requires_verified_otp(self):
        data = {
            "phone": "0785000111",
            "name": "Unverified User",
            "role": "buyer",
            "buyer_type": "household",
            "district": "Kampala",
        }
        url = reverse("accounts:register")
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_register_buyer_success(self):
        phone = "0785123456"
        self.create_verified_otp(phone)
        data = {
            "phone": phone,
            "name": "Jane Doe",
            "role": "buyer",
            "buyer_type": "household",
            "district": "Kampala",
        }
        url = reverse("accounts:register")
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["role"], "buyer")
        self.assertEqual(response.data["user"]["phone"], "+256785123456")

    def test_register_farmer_success(self):
        phone = "0772987654"
        self.create_verified_otp(phone)
        data = {
            "phone": phone,
            "name": "Peter Mukasa",
            "role": "seller",
            "seller_type": "smallholder",
            "district": "Wakiso",
            "nin": "CM900111222ABC",
        }
        url = reverse("accounts:register")
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["role"], "seller")
        self.assertEqual(response.data["user"]["phone"], "+256772987654")

    def test_farmer_requires_nin(self):
        phone = "0772987655"
        self.create_verified_otp(phone)
        data = {
            "phone": phone,
            "name": "Peter Mukasa",
            "role": "seller",
            "seller_type": "smallholder",
            "district": "Wakiso",
        }
        url = reverse("accounts:register")
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nin", response.data)

    def test_farmer_requires_district(self):
        phone = "0772987656"
        self.create_verified_otp(phone)
        data = {
            "phone": phone,
            "name": "Peter Mukasa",
            "role": "seller",
            "seller_type": "smallholder",
            "nin": "CM900111222ABC",
        }
        url = reverse("accounts:register")
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("district", response.data)

    def test_public_registration_blocks_admin(self):
        phone = "0772987657"
        self.create_verified_otp(phone)
        data = {
            "phone": phone,
            "name": "Malicious User",
            "role": "admin",
        }
        url = reverse("accounts:register")
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)


from accounts.utils import (
    clean_phone,
    make_verification_token,
    check_verification_token,
    hash_code,
)


class SecureLoginAndOTPTests(APITestCase):
    """Day 2 Tests: Industrial OTP generation, verification, brute-force locking, and secure login."""

    @patch("accounts.views.send_sms")
    def test_request_otp_generates_6_digit_code_and_salted_hash(self, mock_send_sms):
        url = reverse("accounts:otp-request")
        response = self.client.post(
            url,
            {"phone": "0772111222"},
            format="json",
            REMOTE_ADDR="192.168.1.50",
            HTTP_USER_AGENT="Mozilla/5.0 TestBrowser",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        saved_otp = OTP.objects.filter(phone="+256772111222").first()
        self.assertIsNotNone(saved_otp)
        self.assertEqual(len(saved_otp.code), 6)
        self.assertTrue(saved_otp.code.isdigit())
        self.assertFalse(saved_otp.is_used)
        self.assertEqual(saved_otp.status, OTP.Status.PENDING)
        self.assertEqual(saved_otp.ip_address, "192.168.1.50")
        self.assertEqual(saved_otp.user_agent, "Mozilla/5.0 TestBrowser")

        # Verify salted SHA-256 hash
        self.assertEqual(len(saved_otp.code_hash), 64)
        self.assertEqual(len(saved_otp.salt), 32)
        self.assertTrue(saved_otp.check_code(saved_otp.code))
        self.assertFalse(saved_otp.check_code("000000"))
        mock_send_sms.assert_called_once()

    @patch("accounts.views.send_sms")
    def test_request_otp_cooldown_rate_limit(self, mock_send_sms):
        url = reverse("accounts:otp-request")
        phone = "0772333444"

        # First request should succeed
        first_res = self.client.post(url, {"phone": phone}, format="json")
        self.assertEqual(first_res.status_code, status.HTTP_200_OK)

        # Immediate second request should be throttled (429)
        second_res = self.client.post(url, {"phone": phone}, format="json")
        self.assertEqual(second_res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("wait 1 minute", second_res.data["error"])

    @patch("accounts.views.send_sms")
    def test_request_otp_hourly_limit(self, mock_send_sms):
        phone = "+256772999111"
        for i in range(5):
            otp = OTP.objects.create(
                phone=phone,
                code=f"11111{i}",
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            OTP.objects.filter(pk=otp.pk).update(created_at=timezone.now() - timedelta(minutes=10 + i))

        url = reverse("accounts:otp-request")
        response = self.client.post(url, {"phone": phone}, format="json")
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("hour", response.data["error"])

    @patch("accounts.views.send_sms")
    def test_request_otp_daily_limit(self, mock_send_sms):
        phone = "+256772999222"
        for i in range(10):
            otp = OTP.objects.create(
                phone=phone,
                code=f"22222{i}",
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            OTP.objects.filter(pk=otp.pk).update(created_at=timezone.now() - timedelta(hours=1 + i))

        url = reverse("accounts:otp-request")
        response = self.client.post(url, {"phone": phone}, format="json")
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Daily code limit reached", response.data["error"])

    @patch("accounts.views.send_sms")
    def test_request_otp_ip_rate_limit(self, mock_send_sms):
        client_ip = "192.168.100.99"
        # 15 requests from different phones on the same IP
        for i in range(15):
            otp = OTP.objects.create(
                phone=f"+256772888{i:03d}",
                code="123456",
                ip_address=client_ip,
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            OTP.objects.filter(pk=otp.pk).update(created_at=timezone.now() - timedelta(minutes=5))

        url = reverse("accounts:otp-request")
        response = self.client.post(
            url,
            {"phone": "0772999333"},
            format="json",
            REMOTE_ADDR=client_ip,
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Too many requests from your network", response.data["error"])

    @patch("accounts.views.send_sms")
    def test_request_otp_invalidates_previous_codes(self, mock_send_sms):
        phone = "+256772555666"
        old_otp = OTP.objects.create(
            phone=phone,
            code="111111",
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        OTP.objects.filter(pk=old_otp.pk).update(created_at=timezone.now() - timedelta(minutes=2))

        url = reverse("accounts:otp-request")
        response = self.client.post(url, {"phone": phone}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        old_otp.refresh_from_db()
        self.assertTrue(old_otp.is_used)
        self.assertEqual(old_otp.status, OTP.Status.REVOKED)

    def test_verify_otp_for_existing_user_returns_token(self):
        phone = "+256772777888"
        user = User.objects.create_user(
            phone=phone,
            role=User.Role.BUYER,
            name="Logged In Buyer",
        )
        salt = "abcd1234efgh5678"
        code_hash = hash_code("654321", salt)
        OTP.objects.create(
            phone=phone,
            code_hash=code_hash,
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        url = reverse("accounts:otp-verify")
        response = self.client.post(url, {"phone": phone, "code": "654321"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["phone"], phone)

        user.refresh_from_db()
        self.assertTrue(user.otp_verified)

    def test_verify_otp_for_new_phone_returns_signed_token(self):
        phone = "0772888999"
        formatted_phone = clean_phone(phone)
        salt = "testsalttestsalt"
        code_hash = hash_code("998877", salt)
        OTP.objects.create(
            phone=formatted_phone,
            code_hash=code_hash,
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        url = reverse("accounts:otp-verify")
        response = self.client.post(url, {"phone": phone, "code": "998877"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get("verified"))
        self.assertEqual(response.data.get("phone"), formatted_phone)
        self.assertIn("verification_token", response.data)

        # Verify signed token validity
        token = response.data["verification_token"]
        self.assertTrue(check_verification_token(token, formatted_phone))

    def test_register_with_signed_verification_token_succeeds(self):
        phone = "+256772444555"
        token = make_verification_token(phone)

        url = reverse("accounts:register")
        data = {
            "phone": phone,
            "name": "Token Verified Buyer",
            "role": "buyer",
            "buyer_type": "household",
            "district": "Kampala",
            "verification_token": token,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["phone"], phone)

    def test_register_with_tampered_verification_token_fails(self):
        phone = "+256772444666"
        tampered_token = "invalid.signature.token"

        url = reverse("accounts:register")
        data = {
            "phone": phone,
            "name": "Tampered Token Buyer",
            "role": "buyer",
            "buyer_type": "household",
            "district": "Kampala",
            "verification_token": tampered_token,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone", response.data)

    def test_verify_otp_wrong_code_increments_attempts(self):
        phone = "+256772000333"
        salt = "salt1234salt1234"
        code_hash = hash_code("123456", salt)
        otp = OTP.objects.create(
            phone=phone,
            code_hash=code_hash,
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        url = reverse("accounts:otp-verify")
        response = self.client.post(url, {"phone": phone, "code": "000000"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("4 attempt(s) remaining", response.data["error"])

        otp.refresh_from_db()
        self.assertEqual(otp.attempts, 1)

    def test_verify_otp_locks_after_5_failed_attempts(self):
        phone = "+256772000444"
        salt = "salt1234salt1234"
        code_hash = hash_code("123456", salt)
        otp = OTP.objects.create(
            phone=phone,
            code_hash=code_hash,
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=10),
            attempts=4,
        )

        url = reverse("accounts:otp-verify")
        # 5th failed attempt
        response = self.client.post(url, {"phone": phone, "code": "000000"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Too many failed attempts", response.data["error"])

        otp.refresh_from_db()
        self.assertTrue(otp.is_used)
        self.assertEqual(otp.status, OTP.Status.FAILED)

    def test_verify_otp_expired_code_rejected(self):
        phone = "+256772000555"
        OTP.objects.create(
            phone=phone,
            code="123456",
            expires_at=timezone.now() - timedelta(minutes=5),
        )

        url = reverse("accounts:otp-verify")
        response = self.client.post(url, {"phone": phone, "code": "123456"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", response.data["error"])

    def test_disabled_user_cannot_login(self):
        phone = "+256772000666"
        User.objects.create_user(
            phone=phone,
            role=User.Role.BUYER,
            name="Disabled User",
            is_active=False,
        )
        salt = "salt1234salt1234"
        code_hash = hash_code("123456", salt)
        OTP.objects.create(
            phone=phone,
            code_hash=code_hash,
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        url = reverse("accounts:otp-verify")
        response = self.client.post(url, {"phone": phone, "code": "123456"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("disabled", response.data["error"])


class Day3ConnectingLoginsAndRoleRoutingTests(APITestCase):
    """
    Day 3 Tests: Connecting Logins & Role-Based Dashboard Authorization.
    Validates that:
    - Each role (buyer, seller, admin) logs in securely via OTP
    - /accounts/me/ restores session with exact role metadata
    - Role-specific dashboard endpoints strictly enforce access control (403 for unauthorized roles)
    - Admin verification queue & approval lifecycle function seamlessly
    """

    def setUp(self):
        self.buyer = User.objects.create_user(
            phone="+256782111001",
            role=User.Role.BUYER,
            name="Grace Buyer",
            buyer_type=User.BuyerType.HOUSEHOLD,
            district="Kampala",
            otp_verified=True,
        )
        self.seller = User.objects.create_user(
            phone="+256772111002",
            role=User.Role.SELLER,
            name="David Farmer",
            seller_type=User.SellerType.SMALLHOLDER,
            district="Wakiso",
            is_verified=True,
            otp_verified=True,
        )
        self.admin = User.objects.create_user(
            phone="+256700111003",
            role=User.Role.ADMIN,
            name="Platform Admin",
            is_staff=True,
            otp_verified=True,
        )

    def _login_via_otp(self, phone):
        """Helper to create and verify OTP, returning auth token."""
        salt = "testsalt12345678"
        code = "789123"
        code_hash = hash_code(code, salt)
        OTP.objects.create(
            phone=phone,
            code_hash=code_hash,
            salt=salt,
            expires_at=timezone.now() + timedelta(minutes=10),
            status=OTP.Status.PENDING,
        )
        url = reverse("accounts:otp-verify")
        res = self.client.post(url, {"phone": phone, "code": code}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        return res.data["token"], res.data["user"]

    def test_buyer_login_and_role_routing(self):
        token, user_data = self._login_via_otp(self.buyer.phone)
        self.assertEqual(user_data["role"], "buyer")
        self.assertEqual(user_data["name"], "Grace Buyer")

        # Session restore via /accounts/me/
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        me_res = self.client.get(reverse("accounts:me"))
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["role"], "buyer")

        # Buyer cannot access seller dashboard
        seller_dash_url = reverse("listings:seller-dashboard")
        dash_res = self.client.get(seller_dash_url)
        self.assertEqual(dash_res.status_code, status.HTTP_403_FORBIDDEN)

        # Buyer cannot access admin pending verifications
        pending_url = reverse("accounts:pending")
        pending_res = self.client.get(pending_url)
        self.assertEqual(pending_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_login_and_role_routing(self):
        token, user_data = self._login_via_otp(self.seller.phone)
        self.assertEqual(user_data["role"], "seller")
        self.assertTrue(user_data["is_verified"])

        # Session restore via /accounts/me/
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        me_res = self.client.get(reverse("accounts:me"))
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["role"], "seller")

        # Seller CAN access seller dashboard
        seller_dash_url = reverse("listings:seller-dashboard")
        dash_res = self.client.get(seller_dash_url)
        self.assertEqual(dash_res.status_code, status.HTTP_200_OK)
        self.assertIn("active_listings", dash_res.data)

        # Seller cannot access admin pending verifications
        pending_url = reverse("accounts:pending")
        pending_res = self.client.get(pending_url)
        self.assertEqual(pending_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_login_and_pending_verification_lifecycle(self):
        token, user_data = self._login_via_otp(self.admin.phone)
        self.assertEqual(user_data["role"], "admin")

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        # Create an unverified seller with submitted verification
        unverified_seller = User.objects.create_user(
            phone="+256773555999",
            role=User.Role.SELLER,
            name="New Farmer",
            nin="CM9900112233AA",
            district="Mukono",
            is_verified=False,
            verification_submitted_at=timezone.now(),
        )

        # Admin views pending queue
        pending_url = reverse("accounts:pending")
        pending_res = self.client.get(pending_url)
        self.assertEqual(pending_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pending_res.data["count"], 1)
        self.assertEqual(pending_res.data["results"][0]["name"], "New Farmer")

        # Admin approves seller
        with patch("accounts.views.send_sms") as mock_sms:
            approve_url = reverse("accounts:approve-seller", kwargs={"pk": unverified_seller.pk})
            approve_res = self.client.post(approve_url)
            self.assertEqual(approve_res.status_code, status.HTTP_200_OK)
            mock_sms.assert_called_once()

        unverified_seller.refresh_from_db()
        self.assertTrue(unverified_seller.is_verified)
        self.assertIsNotNone(unverified_seller.verified_at)

    def test_unauthenticated_session_restore_fails(self):
        me_url = reverse("accounts:me")
        res = self.client.get(me_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Invalid token
        self.client.credentials(HTTP_AUTHORIZATION="Token invalid_token_12345")
        bad_token_res = self.client.get(me_url)
        self.assertEqual(bad_token_res.status_code, status.HTTP_401_UNAUTHORIZED)

