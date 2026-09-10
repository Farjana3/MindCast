
# MindCast

A machine learning web application that predicts a student's mental health score based on social media habits, academic routine, lifestyle patterns, and stress level.

MindCast combines a **scikit-learn machine learning pipeline**, **FastAPI REST API**, and a **HTML/CSS/JavaScript frontend** to provide an end-to-end ML prediction application.

## Live Application

**Frontend:** https://mindcast-1.onrender.com

**Backend API:** https://mindcast-h4er.onrender.com`

**API Documentation:** https://mindcast-h4er.onrender.com/docs

---

## Overview

MindCast predicts a continuous **Mental Health Score (0–10)** from 12 user-provided inputs covering:

* Demographics
* Social media usage
* Academic routine
* Physical activity
* Sleep
* Stress level

The trained model is a **Random Forest Regressor** integrated into a scikit-learn `Pipeline`. The complete preprocessing workflow is stored together with the model and loaded by the FastAPI backend during application startup.

The frontend collects user inputs, sends them to the backend `/predict` endpoint, and displays the predicted mental health score.

---

## Key Features

* Random Forest regression for mental health score prediction
* 5,000-row student survey dataset
* Data preprocessing and feature engineering
* `ColumnTransformer` for feature-specific preprocessing
* `Pipeline` combining preprocessing and the regression model
* FastAPI REST API
* Pydantic request validation
* Interactive Swagger/OpenAPI documentation
* HTML/CSS/JavaScript frontend
* CORS-enabled backend
* Model serialization using Joblib
* Frontend and backend deployed separately on Render

---

## Machine Learning Workflow

```text
Dataset
   ↓
Data Cleaning
   ↓
Feature Engineering
   ↓
Train/Test Split
   ↓
Preprocessing Pipeline
   ↓
Model Training
   ↓
Model Evaluation
   ↓
Model Serialization
   ↓
FastAPI Backend
   ↓
Frontend
```

### 1. Dataset

The model is trained using:

`Student Social Media And Mental Health Impact.csv`

The dataset contains **5,000 rows and 13 columns**:

* 12 input features
* 1 target variable: `Mental_Health_Score`

The original source of the dataset is not documented in the project files.

### 2. Data Preparation

The following preprocessing steps were performed:

* Duplicate rows were removed.
* Negative values in `Physical_Activity_Hours` were clipped to `0`.
* An IQR-based outlier analysis was performed for inspection. No rows were removed based on this analysis.

### 3. Feature Engineering

#### Country Grouping

The `Country` feature contains many different categories. To reduce categorical complexity, countries were grouped into the most frequent countries plus an `Other` category.

The grouped feature is stored as:

`Grouped_country`

If a country is not included in the predefined categories, the API maps it to `Other`.

#### Skewed Feature Transformation

`Study_Hours` was identified as the numeric feature requiring transformation and was processed using `log1p`.

---

## Machine Learning Pipeline

A scikit-learn `ColumnTransformer` applies different preprocessing techniques to different feature groups.

| Feature Group  | Features                                                                                            | Transformation             |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------- |
| Skewed Numeric | `Study_Hours`                                                                                       | `log1p` + `StandardScaler` |
| Numeric        | `Age`, `Avg_Daily_Usage_Hours`, `Daily_Unlocks`, `Physical_Activity_Hours`, `Sleep_Hours_Per_Night` | `StandardScaler`           |
| Ordinal        | `Stress_Level`                                                                                      | `OrdinalEncoder`           |
| Categorical    | `Gender`, `Academic_Level`, `Most_Used_Platform`, `Purpose_Of_Use`, `Grouped_country`               | `OneHotEncoder`            |

The preprocessing and model are combined inside a single scikit-learn `Pipeline`.

This ensures that the same preprocessing used during training is automatically applied when new data is submitted through the API.

---

## Model Training

Two model families were evaluated using a **70/30 train-test split** with `random_state=42`:

| Model                   | Train R² | Test R² | Test MAE |
| ----------------------- | -------: | ------: | -------: |
| Linear Regression       |   0.7398 |  0.7237 |    0.536 |
| Random Forest (Default) |   0.8776 |  0.9808 |    0.347 |
| Random Forest (Tuned)   |   0.8650 |  0.9547 |    0.369 |

A `RandomizedSearchCV` with 15 iterations and 5-fold cross-validation was also used to tune the Random Forest hyperparameters.

The tuned configuration was:

```text
n_estimators = 200
max_depth = 15
min_samples_split = 5
min_samples_leaf = 2
```

The **default Random Forest pipeline** was ultimately selected for deployment because it achieved the strongest held-out test performance among the evaluated models.

### Final Model

**Random Forest Regressor**

The complete trained pipeline—including preprocessing and the Random Forest model—is serialized as:

```text
Mental_Health_Model.pkl
```

using Joblib.

---

## Prediction Flow

```text
User Input
    ↓
Frontend Form
    ↓
FastAPI /predict
    ↓
Pydantic Validation
    ↓
DataFrame Construction
    ↓
ColumnTransformer
    ↓
Random Forest Pipeline
    ↓
Predicted Mental Health Score
    ↓
JSON Response
    ↓
Frontend Display
```

---

## Backend API

The backend is built using **FastAPI**.

Pydantic is used to validate incoming request data, including:

* Numeric ranges
* Allowed categorical values
* Required fields

### `GET /`

Basic backend health-check endpoint.

Example response:

```json
{
  "message": "Here is me"
}
```

### `POST /predict`

Accepts student information and returns the predicted mental health score.

Example request:

```json
{
  "age": 22,
  "gender": "Male",
  "country": "Bangladesh",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 5.0,
  "daily_unlocks": 150,
  "study_hours": 3.5,
  "physical_activity_hours": 1.5,
  "sleep_hours_per_night": 6.5,
  "stress_level": "Medium"
}
```

Example response:

```json
{
  "predicted_mental_health_score": 6.42
}
```

### API Documentation

FastAPI automatically provides interactive API documentation through:

```text
/docs
```

and ReDoc through:

```text
/redoc
```

Once the backend is deployed, these can be accessed using the backend Render URL.

---

## Frontend

The frontend is implemented using:

* HTML5
* CSS3
* Vanilla JavaScript

It provides a simple form divided into:

* **About You**
* **Digital Habits**
* **Lifestyle & Wellbeing**

The user enters the required information and submits the form.

The frontend sends the input data to the FastAPI `/predict` endpoint and displays the returned mental health score.

---

## Project Architecture

```text
┌─────────────────────┐
│   HTML/CSS/JS       │
│     Frontend        │
└──────────┬──────────┘
           │
           │ POST /predict
           ↓
┌─────────────────────┐
│      FastAPI        │
│      Backend        │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Pydantic Validation│
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ ColumnTransformer   │
│    Preprocessing    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Random Forest       │
│     Regressor       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Predicted Score     │
└─────────────────────┘
```

---

## Project Structure

```text
MindCast/
│
├── main.py
├── Mental_Health_Model.pkl
├── Student Social Media And Mental Health Impact.csv
├── Untitled.ipynb
│
├── index.html
├── style.css
├── script.js
│
├── requirements.txt
├── runtime.txt
│
└── mentalHealth/
```

### Main Files

| File                                                | Description                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `main.py`                                           | FastAPI backend, API endpoints, validation, and prediction logic |
| `Mental_Health_Model.pkl`                           | Serialized ML pipeline                                           |
| `Student Social Media And Mental Health Impact.csv` | Training dataset                                                 |
| `Untitled.ipynb`                                    | EDA, preprocessing, model training, and evaluation               |
| `index.html`                                        | Frontend interface                                               |
| `style.css`                                         | Frontend styling                                                 |
| `script.js`                                         | Frontend interaction and API communication                       |
| `requirements.txt`                                  | Python dependencies                                              |
| `runtime.txt`                                       | Python runtime version for deployment                            |

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Farjana3/MindCast.git
cd MindCast
```

Create and activate a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Run Locally

### Start the FastAPI Backend

```bash
uvicorn main:app --reload
```

The backend will run by default at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### Run the Frontend

Open `index.html` in a browser or serve the frontend using a static file server.

Make sure the frontend API configuration points to the correct backend URL.

---

## Deployment

MindCast is deployed on **Render** using separate frontend and backend services.

| Component         | Platform |
| ----------------- | -------- |
| Frontend          | Render   |
| Backend / FastAPI | Render   |

### Live Links

**Live Application:**
https://mindcast-1.onrender.com

**Backend API:**
https://mindcast-h4er.onrender.com

**Swagger API Documentation:**
https://mindcast-h4er.onrender.com/docs

The backend uses **Python 3.11.7**, specified in `runtime.txt`.

---

## Technologies Used

### Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* Random Forest Regressor
* Linear Regression
* RandomizedSearchCV
* Joblib
* Matplotlib
* Seaborn

### Backend

* FastAPI
* Uvicorn
* Pydantic

### Frontend

* HTML5
* CSS3
* JavaScript

### Deployment

* Render

---

## Future Improvements

* Further model validation and hyperparameter optimization
* Automated tests for the prediction API and ML pipeline
* More robust production CORS configuration
* Improved error handling and API documentation
* Additional model comparison and explainability
* Monitoring of model performance after deployment



This project is intended for educational and portfolio purposes.
