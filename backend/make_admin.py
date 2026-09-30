from app.database import SessionLocal
from app.user_model import User

def make_admin(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        user.role = "admin"
        db.commit()
        print(f"Success: {email} is now an admin!")
    else:
        print("User not found. Sign up via the frontend first.")
        
    db.close()

# Replace with your actual signup email
make_admin("divyamagarwal0123@gmail.com")