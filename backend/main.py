import os
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta, timezone ,date
from typing import Optional
from enum import Enum as PyEnum
from fastapi import Depends, FastAPI, HTTPException, status ,UploadFile ,File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import (
    Column, Date, DateTime,
    Enum, Integer, String, Text,
    ForeignKey, DECIMAL, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship
from pathlib import Path
from typing import List
from decimal import Decimal

PROFILE_PIC_DIR = "assets/profile_pics"
os.makedirs(PROFILE_PIC_DIR, exist_ok=True)  # Creation de dossier s'il n'existe pas 

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:amen2004@localhost/projetweb") #database url to access the database
SECRET_KEY = os.getenv("SECRET_KEY", "secret123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #la methode de hashing de mdp , bcrypt est l'algo et deprecated=auto pour que si on change l'algo apres les hashing yo93dou ye5dmou
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") #indcation que les endpoints protege par ce scheme require a token in the header

#binds the database and creates a new sesion
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base() # creates a class for the base ORM models

def now_utc():
    return datetime.now(timezone.utc) # returns the current time 

#database model (maps a model based on a table in the database )
class UserRole(PyEnum):
    admin = "admin"
    student = "student"

class RequestType(PyEnum):
    presence = "attestation de presence"
    reussite = "attestation de reussite"

class RequestStatus(PyEnum):
    pending = "pending"
    in_review = "in_review"
    approved = "approved"
    rejected = "rejected"
    ready = "ready"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True) #creating an index helps with performance 
    username = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(100), nullable=False, unique=True, index=True)
    hashed_pw = Column(String, nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in UserRole]), nullable=False)
    classe = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=now_utc)

class Specialty(Base):
    __tablename__ = "specialties"
    specialty_id = Column(Integer, primary_key=True)
    specialty_name = Column(String(100), unique=True)

class AcademicYear(Base):
    __tablename__ = "academic_years"
    academic_year_id = Column(Integer, primary_key=True)
    year_name = Column(String(50))
    year_order = Column(Integer)
    semester_number = Column(Integer)

class student_academic_info(Base):
    __tablename__ = "student_academic_info"
    student_id = Column(Integer, primary_key=True)
    specialty_id = Column(Integer, ForeignKey("specialties.specialty_id"))
    academic_year_id = Column(Integer, ForeignKey("academic_years.academic_year_id"))
    created_at = Column(DateTime, default=now_utc)

class Subject(Base):
    __tablename__ = "subjects"
    subject_id = Column(Integer, primary_key=True)
    subject_code = Column(String(20), unique=True)
    subject_name = Column(String(100))
    specialty_id = Column(Integer, ForeignKey("specialties.specialty_id"))
    academic_year_id = Column(Integer, ForeignKey("academic_years.academic_year_id"))

class Absence(Base):
    __tablename__ = "absences"
    absence_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    date_absent = Column(Date, nullable=False)
    created_at = Column(DateTime, default=now_utc)

class Grade(Base):
    __tablename__ = "grades"
    grade_id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"), nullable=False)
    grade = Column(DECIMAL(5,2), nullable=False)
    entered_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    date_entered = Column(DateTime, default=now_utc)

class Request(Base):
    __tablename__ = "requests"

    request_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    request_type = Column(Enum(RequestType, values_callable=lambda x: [e.value for e in RequestType]), nullable=False)
    motive = Column(Text, nullable=False)
    justification = Column(Text, nullable=False)
    status = Column(Enum(RequestStatus, values_callable=lambda x: [e.value for e in RequestStatus]), default=RequestStatus.pending.value, nullable=False)
    created_at = Column(DateTime, default=now_utc)

class StudentProfilePic(Base):
    __tablename__ = "student_profile_pics"

    profile_pic_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    picture_url = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=now_utc)

class Event(Base):
    __tablename__ = "event"

    event_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    organizer_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    img_url = Column(String, nullable=False)
#schemes for the responses and requests 
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    classe: str

class UserOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    classe: str
    created_at: datetime

    class Config:
        orm_mode = True # allows me to use attributes directly iwthout the need of a  json format (fastapi will convert it tot json before sneding itanyway )

class StudentProfileOut(BaseModel):
    user_id: int
    username: str
    email: str
    classe: str
    year: Optional[str]
    specialty: Optional[str]

    class Config:
        orm_mode = True

class StudentGradeOut(BaseModel): # model for getting the grades of  a particular student in each grade that he studies 
    subject_code: str
    subject_name: str
    grade: float
    
    class Config:
        orm_mode = True #this one if for one subject so we need to create a list of them 

class StudentAbsenceOut(BaseModel):
    absence_id: int
    date_absent: date
    created_at: datetime
    
    class Config:
        orm_mode = True
#used for updating student info
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    classe: Optional[str] = None
    role: Optional[UserRole] = None 

class RequestCreate(BaseModel):
    request_type: RequestType
    motive: str
    justification: str

class RequestResponse(BaseModel):
    request_id: int
    student_id: int
    request_type: RequestType
    motive: str
    justification: str
    status: RequestStatus
    created_at: datetime

    class Config:
        orm_mode = True

class UpdateRequestStatus(BaseModel):
    status: RequestStatus

#class for student to modify his request 
class UpdateStudentRequest(BaseModel):
    motive: Optional[str] = None
    justification: Optional[str] = None

class ProfilePicResponse(BaseModel):
    profile_pic_id: int
    student_id: int
    picture_url: str
    created_at: datetime

    class Config:
        orm_mode = True

class ProfilePicCreate(BaseModel):
    picture_url: str

class GradeCreate(BaseModel):
    student_id: int
    subject_id: int
    grade: Decimal

class GradeUpdate(BaseModel):
    grade: Decimal

class EventOut(BaseModel):
    event_id: int
    name: str
    organizer_name: str
    description: str
    img_url: str

    class Config:
        orm_mode = True 

#the functions i need 
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
#checks if the plain password we passed matches the hashed version or not 
def get_password_hash(pw: str) -> str:
    return pwd_context.hash(pw)
#hashes a plain password
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str: #takes a dct as an input 
    to_encode = data.copy() #makes a copy of the data we passed as a para 
    expire = now_utc() + (expires_delta or timedelta(minutes=15)) #adds an expiration time 
    to_encode.update({"exp": expire}) # adds the epiration time to the copied data
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM) #returns a jwt access token as a "string" 

def get_user(db: Session, username: str) -> Optional[User]: #takes the username 
    return db.query(User).filter(User.username == username).first() #if the user is found return the user (object format)

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]: #takes the username and the password of the user
    user = get_user(db, username) #get the user object that corresponds to that username 
    if not user or not verify_password(password, user.hashed_pw): #if the user is not  found or the password s wrong 
        return None # return nothing 
    return user # return the user if found 

#database dependency 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
#get currect customer dependency to get the user that is currently logged in 
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )#example of the httpexception we are going to raise if we have an error 
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"leeway": 60}
        ) #this ppart decodes the token revealing its contents in a an python object format which basically reesembles json in this case
        user_id = payload.get("sub") # getting the user id from the decoded token 
        if user_id is None:
            raise creds_exc #if there is no user id we raise an exception 
        try:
            user_id = int(user_id) #we convert the userid to an int id it exists 
        except ValueError:
            raise creds_exc #raise error again if we cannot transform it to an int
    except JWTError as e:
        raise creds_exc #raise an error if we get  a jwt error 

    user = db.query(User).get(user_id) #get the user with that user_id
    if user is None:
        raise creds_exc # if there is no user with that user_id we raise an error 
    return user
#creating our fastapi instance and adding the middleware (necessary for allowing angular to communicate with the api)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # This allows the Authorization header
)
assets_path = Path(__file__).parent / "assets"
app.mount("/assets", StaticFiles(directory=assets_path), name="assets") # we are mounting a static file handeler (pour le menagement des ficher )
#on peut maintenant accesdes au http://localhost...../assets/logo.png
#the routes we are going to use 
# registration route 
@app.post("/register", response_model=UserOut) # post end point at register that returns a response like userout 
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> User: 
    exists = db.query(User).filter( 
        (User.username == user_in.username) |
        (User.email == user_in.email)
    ).first() #chaeks if he user already exists in the data base or not 
    if exists:
        raise HTTPException(400, "Username or email already registered") # error if the user exists

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_pw=get_password_hash(user_in.password),
        role=UserRole.student,
        classe=user_in.classe
    ) #maps the values to the attributes of the database table
    db.add(user) # adds the user to the database (table users )
    db.commit() # commits the cange because we have autocommit offf
    db.refresh(user) # refreshs the object with the data now updated 
    return user # returns the object (will be returned in a json format )
#token/login route
@app.post("/token", response_model=Token) # post end poit at token that returns a token (acces token and type )
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), #this formedata uses that special type of header 
    db: Session = Depends(get_db)
) -> dict: #function returns a dictionnary 
    user = authenticate_user(db, form_data.username, form_data.password) #gets the user that is trying to log in 
    if not user: # if it doesn't exist raise an error 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    #if it exists create an acceeesss token that has the id /role /and the expiration time 
    access_token = create_access_token(
        data={"sub": str(user.user_id), "role": user.role.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"} # return the access token in a json   
'''
this will be the format returned by the /token route (json format)
{
  "access_token": "string",
  "token_type": "string"
}                

'''
#profile info route (excllusive   for students)
@app.get("/student/profile/{user_id}", response_model=StudentProfileOut) # a get end point that passes the id as a parameer 
def get_student_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) #we pass down this dependency to know that the user is logged in and get his info
): #the user id is passed in the parameters of the function
    if current_user.role != UserRole.student: #if the user is not a student get the following error
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access student profiles"
        )

    if current_user.user_id != user_id:#if the id passed does not belong to the user that is logged in shox this error
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )
    #if evrything matches run the following command
    result = db.query(
        User,
        AcademicYear.year_name,
        Specialty.specialty_name
    ).select_from(User)\
    .outerjoin(student_academic_info, User.user_id == student_academic_info.student_id)\
    .outerjoin(AcademicYear, student_academic_info.academic_year_id == AcademicYear.academic_year_id)\
    .outerjoin(Specialty, student_academic_info.specialty_id == Specialty.specialty_id)\
    .filter(User.user_id == user_id)\
    .first()
    #if no result show the following error 
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found"
        )
    #if there is a result assign it to the necessary variables
    user, year_name, specialty_name = result
    # return the result in a json format 
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "classe": user.classe,
        "year": year_name,
        "specialty": specialty_name
    }

@app.get("/student/{user_id}/grades", response_model=list[StudentGradeOut])
def get_student_grades(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization check
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access grades"
        ) #raise an exception if the user is not a student
    
    if current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own grades"
        ) # a student can only get grades that are he's own 

    # Query grades with subject information
    grades = db.query(
        Grade.grade,
        Subject.subject_code,
        Subject.subject_name
    ).join(
        Subject, Grade.subject_id == Subject.subject_id
    ).filter(
        Grade.student_id == user_id
    ).all() # query needed to get the info we want to diaply 

    if not grades:
        return []

    # Convert to list of dictionaries
    return [{
        "subject_code": sub.subject_code,
        "subject_name": sub.subject_name,
        "grade": float(sub.grade)
    } for sub in grades] # we convert the response to a list for all the subject that particular student studies

#method to get the absences of a specific student 
@app.get("/student/{user_id}/absences", response_model=list[StudentAbsenceOut])
def get_student_absences(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization check
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This function is reserved for students"
        )
    
    if current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own absence records"
        )

    # Query absences for the student
    absences = db.query(Absence).filter(
        Absence.student_id == user_id
    ).order_by(Absence.date_absent.desc()).all()

    return absences

#method to get the list of all students registered on the platform 
@app.get("/admin/students", response_model=list[UserOut])
def get_all_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization check - only admins can access this endpoint
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this endpoint"
        )
    
    # Query all students (users with role 'student')
    students = db.query(User).filter(
        User.role == UserRole.student
    ).order_by(User.username).all()
    
    return students

#update student method
@app.put("/admin/students/{user_id}", response_model=UserOut)
def update_student(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization check - only admins can update students
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update student records"
        )
    
    # Get the student to update
    student = db.query(User).filter(User.user_id == user_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update only the fields that were provided
    if user_update.username is not None:
        # Check if username is already taken by another user
        existing_user = db.query(User).filter(
            User.username == user_update.username,
            User.user_id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        student.username = user_update.username
    
    if user_update.email is not None:
        # Check if email is already taken by another user
        existing_email = db.query(User).filter(
            User.email == user_update.email,
            User.user_id != user_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        student.email = user_update.email
    
    if user_update.classe is not None:
        student.classe = user_update.classe
    
    if user_update.role is not None:
        student.role = user_update.role
    
    db.commit()
    db.refresh(student)
    
    return student
    #student deletion function 
@app.delete("/admin/students/{user_id}", response_model=dict)
def delete_student(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization check - only admins can delete students
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete students"
        )
    
    # Check if student exists
    student = db.query(User).filter(User.user_id == user_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    try:
        # First delete dependent records (absences, grades, academic info)
        db.query(Absence).filter(Absence.student_id == user_id).delete()
        db.query(Grade).filter(Grade.student_id == user_id).delete()
        db.query(student_academic_info).filter(
            student_academic_info.student_id == user_id
        ).delete()
        
        # Then delete the student
        db.delete(student)
        db.commit()
        
        return {"status": "success", "message": "Student deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting student: {str(e)}"
        )

@app.post("/student/{user_id}/requests", response_model=RequestResponse)
def create_request_for_student(
    user_id: int,
    request_data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):   #auth check 
    if current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to create a request for another user."
        )
    # tole check (seul l'etudiant ajoute des requetes)
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create requests."
        )

    new_request = Request(
        student_id=user_id,
        request_type=request_data.request_type,
        motive=request_data.motive,
        justification=request_data.justification
    )

    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request
#api call pour afficher tous les requetes que un etudiant  a fait
@app.get("/student/{student_id}/requests", response_model=list[RequestResponse])
def get_requests_by_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #check pour chois de id correct + role correct
    if current_user.role != UserRole.admin and current_user.user_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    requests = db.query(Request).filter(Request.student_id == student_id).all()
    return requests
#api call pour afficher tous les requestes (admin specific)
@app.get("/admin/requests", response_model=list[RequestResponse])
def get_all_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    requests = db.query(Request).all()
    return requests


#api call pour l'admin ,il change le status de la requete , le status peut etre approved ready rejected pending et in review
@app.put("/admin/requests/{request_id}/status", response_model=RequestResponse)
def update_request_status(
    request_id: int,
    status_update: UpdateRequestStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update request status"
        )
    
    #requete de mis a hour
    request = db.query(Request).filter(Request.request_id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
    
    # Update the status
    request.status = status_update.status
    
    db.commit()
    db.refresh(request)
    
    return request

#api call for student to modify the motive and just on his requests , only pending requests can be modified

# student can change the motive and the justification (only those two)
@app.put("/student/requests/{request_id}", response_model=RequestResponse)
def update_student_request(
    request_id: int,
    request_update: UpdateStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can update their requests"
        )
    
   
    request = db.query(Request).filter(
        Request.request_id == request_id,
        Request.student_id == current_user.user_id  # testez si la demande appartied au etudin logged in 
        #on a fait ce  chec=que ici puisque on n'apas passer l'id de user dans l'url
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or you don't have permission to modify it"
        )
    
    # Check if request is still in pending status
    if request.status != RequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only modify requests that are in pending status"
        )
    
    #update the provided fields (optional fields)
    if request_update.motive is not None:
        request.motive = request_update.motive
    
    if request_update.justification is not None:
        request.justification = request_update.justification
    
    db.commit()
    db.refresh(request)
    
    return request

#api call that allows the student to delete a request (only if itsi still pending )
@app.delete("/student/requests/{request_id}", response_model=dict)
def delete_student_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can delete their requests"
        )

    request = db.query(Request).filter(
        Request.request_id == request_id,
        Request.student_id == current_user.user_id  
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found or you don't have permission to delete it"
        )
    
    
    if request.status != RequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only delete requests that are in pending status"
        )
    
    try:
        
        db.delete(request)
        db.commit()
        
        return {
            "status": "success",
            "message": "Request deleted successfully",
            "deleted_request_id": request_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting request: {str(e)}"
        )
    
#image upmoad for profile 
@app.post("/student/{student_id}/upload-profile-pic", response_model=ProfilePicResponse)
async def upload_profile_pic(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization
    if current_user.user_id != student_id and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the student or admin can upload pictures"
        )

    # Validate file type (le fichier doit etre une image)
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    # Validate file size (max 5MB)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 5MB limit"
        )

    # Creation de dossier si'l n'existe pas
    os.makedirs(PROFILE_PIC_DIR, exist_ok=True)

    # creation de now et de detail sur les ficher (image )
    file_ext = os.path.splitext(file.filename)[1]
    timestamp = int(datetime.now().timestamp())
    filename = f"profile_{student_id}_{timestamp}{file_ext}"
    file_path = os.path.join(PROFILE_PIC_DIR, filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Creation de l'url de l'image
    picture_url = f"/assets/profile_pics/{filename}"

    # Update or create record in database
    try:
        existing_pic = db.query(StudentProfilePic).filter(
            StudentProfilePic.student_id == student_id
        ).first()

        if existing_pic:
            # s'il esxiste deja une image , eaffacer cette img
            old_file_path = os.path.join(PROFILE_PIC_DIR, os.path.basename(existing_pic.picture_url))
            if os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                except OSError:
                    pass  # on a utilis pass pour ne pas passer une erreru si on ne peut pas effacer notre img 
            
            # mis a jour s'il exite deja une photo
            existing_pic.picture_url = picture_url
            existing_pic.created_at = datetime.now(timezone.utc)
        else:
            # creation de nouvel pic
            existing_pic = StudentProfilePic(
                student_id=student_id,
                picture_url=picture_url
            )
            db.add(existing_pic)

        db.commit()
        db.refresh(existing_pic)

        return {
            "profile_pic_id": existing_pic.profile_pic_id,
            "student_id": existing_pic.student_id,
            "picture_url": picture_url,
            "created_at": existing_pic.created_at
        }

    except Exception as e:
        db.rollback()
        # Clean up the uploaded file if DB operation failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

#getting the img for the profile 

@app.get("/student/{student_id}/profile-pic")
def get_profile_pic(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Authorization
    if current_user.role != UserRole.admin and current_user.user_id != student_id:
        raise HTTPException(403, "You can only view your own profile picture")

    profile_pic = db.query(StudentProfilePic).filter(
        StudentProfilePic.student_id == student_id
    ).first()

    if not profile_pic:
        # Return a default image path if no profile pic exists
        return {"picture_url": "/assets/default-profile.JPEG"}
    
    return profile_pic

@app.get("/admin/subjects", response_model=List[dict])
def get_all_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")
    
    subjects = db.query(Subject).all()
    return [{
        "subject_id": s.subject_id,
        "subject_code": s.subject_code,
        "subject_name": s.subject_name
    } for s in subjects]

@app.get("/admin/students/{student_id}/grades", response_model=List[dict])
def get_student_grades_admin(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")
    
    grades = db.query(
        Grade.grade_id,
        Grade.grade,
        Subject.subject_id,
        Subject.subject_code,
        Subject.subject_name
    ).join(
        Subject, Grade.subject_id == Subject.subject_id
    ).filter(
        Grade.student_id == student_id
    ).all()
    
    return [{
        "grade_id": g.grade_id,
        "subject_id": g.subject_id,
        "subject_code": g.subject_code,
        "subject_name": g.subject_name,
        "grade": float(g.grade)
    } for g in grades]

@app.post("/admin/grades", response_model=dict)
def create_grade(
    grade_data: GradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")
    
    # Check if student exists
    student = db.query(User).filter(User.user_id == grade_data.student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
    
    # Check if subject exists
    subject = db.query(Subject).filter(Subject.subject_id == grade_data.subject_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")
    
    # Check if grade already exists for this student and subject
    existing_grade = db.query(Grade).filter(
        Grade.student_id == grade_data.student_id,
        Grade.subject_id == grade_data.subject_id
    ).first()
    
    if existing_grade:
        raise HTTPException(400, "Grade already exists for this student and subject")
    
    # Create new grade
    new_grade = Grade(
        student_id=grade_data.student_id,
        subject_id=grade_data.subject_id,
        grade=grade_data.grade,
        entered_by=current_user.user_id
    )
    
    db.add(new_grade)
    db.commit()
    db.refresh(new_grade)
    
    return {
        "status": "success",
        "grade_id": new_grade.grade_id
    }

@app.put("/admin/grades/{grade_id}", response_model=dict)
def update_grade(
    grade_id: int,
    grade_update: GradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")
    
    grade = db.query(Grade).filter(Grade.grade_id == grade_id).first()
    if not grade:
        raise HTTPException(404, "Grade not found")
    
    grade.grade = grade_update.grade
    db.commit()
    
    return {"status": "success"}

@app.delete("/admin/grades/{grade_id}", response_model=dict)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")
    
    grade = db.query(Grade).filter(Grade.grade_id == grade_id).first()
    if not grade:
        raise HTTPException(404, "Grade not found")
    
    db.delete(grade)
    db.commit()
    
    return {"status": "success"}

@app.get("/events", response_model=list[EventOut])
def get_all_events(db: Session = Depends(get_db)):
    return db.query(Event).all()
