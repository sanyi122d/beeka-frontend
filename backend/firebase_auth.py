import firebase_admin
from firebase_admin import credentials, auth

cred = credentials.Certificate("backend/firebase_service_account.json")
firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token):
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        return None