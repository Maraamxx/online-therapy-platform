CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    date_of_birth DATE,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();


CREATE TABLE Roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE UserRoles (
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    role_id INT REFERENCES Roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE Therapists (
    therapist_id INT PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization TEXT,
    experience_years INT,
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    status VARCHAR(20) CHECK (status IN ('Active', 'Inactive', 'Pending Approval')),
    is_verified BOOLEAN DEFAULT FALSE,
    cancellation_count INT DEFAULT 0 -- Tracks therapist cancellations
);

CREATE TABLE Clients (
    client_id INT PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    therapy_goals TEXT,
    preferred_therapy_type TEXT
);

CREATE TABLE Sessions (
    session_id SERIAL PRIMARY KEY,
    therapist_id INT REFERENCES Therapists(therapist_id) ON DELETE CASCADE,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    date_time TIMESTAMP NOT NULL,
    duration INT CHECK (duration > 0),
    status VARCHAR(20) CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    session_type VARCHAR(20) CHECK (session_type IN ('Video', 'Audio', 'Text')),
    notes TEXT
);

CREATE TABLE Messages (
    message_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES Sessions(session_id) ON DELETE CASCADE,
    sender_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    receiver_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    message_text TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    attachment TEXT
);

CREATE TABLE Payments (
    payment_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    therapist_id INT REFERENCES Therapists(therapist_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_reason TEXT
);

CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES Sessions(session_id) ON DELETE CASCADE,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    therapist_id INT REFERENCES Therapists(therapist_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, client_id, therapist_id) -- Ensure one review per session
);

CREATE TABLE Availability (
    availability_id SERIAL PRIMARY KEY,
    therapist_id INT REFERENCES Therapists(therapist_id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

CREATE TABLE SubscriptionPlans (
    plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(50) UNIQUE NOT NULL, -- Example: "10 Sessions Package"
    description TEXT, -- Optional details about the plan
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    session_limit INT CHECK (session_limit > 0), -- Number of sessions in the package
    duration_days INT CHECK (duration_days > 0), -- Validity period (e.g., 30 days)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ClientSubscriptions (
    subscription_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    plan_id INT REFERENCES SubscriptionPlans(plan_id) ON DELETE CASCADE,
    remaining_sessions INT CHECK (remaining_sessions >= 0) DEFAULT 0, -- Sessions left in the package
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL, -- Expiration date
    status VARCHAR(20) CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    UNIQUE(client_id, plan_id) -- Prevent duplicate active subscriptions
);

CREATE TABLE Appointments (
    appointment_id SERIAL PRIMARY KEY,
    therapist_id INT REFERENCES Therapists(therapist_id) ON DELETE CASCADE,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    -- subscription_id INT REFERENCES ClientSubscriptions(subscription_id) ON DELETE SET NULL, -- Null if pay-per-session
    date_time TIMESTAMP NOT NULL,
    duration INT CHECK (duration > 0),
    status VARCHAR(20) CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Rescheduled')),
    session_type VARCHAR(20) CHECK (session_type IN ('Video', 'Audio', 'Text')),
    cancellation_reason VARCHAR(255),
    notes TEXT,
    CONSTRAINT chk_subscription_or_pay_per_session CHECK (
        (subscription_id IS NOT NULL) OR -- Subscription covers the session
        (subscription_id IS NULL) -- Pay-per-session
    )
);

CREATE TABLE SubscriptionPayments (
    payment_id SERIAL PRIMARY KEY,
    subscription_id INT REFERENCES ClientSubscriptions(subscription_id) ON DELETE CASCADE,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_reason TEXT
);

CREATE TABLE Earnings (
    earning_id SERIAL PRIMARY KEY,
    therapist_id INT REFERENCES Therapists(therapist_id) ON DELETE CASCADE,
    session_id INT REFERENCES Sessions(session_id) ON DELETE SET NULL, -- Null if earnings are from a subscription
    subscription_id INT REFERENCES ClientSubscriptions(subscription_id) ON DELETE SET NULL, -- Null if earnings are from an individual session
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payout_status VARCHAR(20) CHECK (payout_status IN ('Pending', 'Paid')),
    CONSTRAINT chk_earning_source CHECK (
        (session_id IS NOT NULL AND subscription_id IS NULL) OR -- Earnings from individual session
        (session_id IS NULL AND subscription_id IS NOT NULL)    -- Earnings from subscription
    )
);

CREATE TABLE MoodTracking (
    mood_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TherapistMatchingAssessments (
    assessment_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES Clients(client_id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Triggers to Limit Therapist Cancellations
CREATE OR REPLACE FUNCTION check_therapist_cancellations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE Therapists
    SET cancellation_count = cancellation_count + 1
    WHERE therapist_id = NEW.therapist_id;
    
    IF (SELECT cancellation_count FROM Therapists WHERE therapist_id = NEW.therapist_id) > 3 THEN
        UPDATE Therapists SET status = 'Inactive' WHERE therapist_id = NEW.therapist_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_therapist_cancellations
AFTER UPDATE ON Appointments
FOR EACH ROW
WHEN (NEW.status = 'Cancelled')
EXECUTE FUNCTION check_therapist_cancellations();

CREATE TABLE UserResponses (
    client_id INT,
    question_id INT,
    response_value INT,
    PRIMARY KEY (client_id, question_id),
    FOREIGN KEY (client_id) REFERENCES Users(user_id),
    FOREIGN KEY (question_id) REFERENCES AssessmentQuestions(question_id)
);

CREATE TABLE UserTherapistMatches (
    client_id INT,
    therapist_id INT,
    PRIMARY KEY (client_id),
    FOREIGN KEY (client_id) REFERENCES Users(user_id),
    FOREIGN KEY (therapist_id) REFERENCES Therapists(therapist_id)
);

CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,  -- The recipient (patient or therapist)
    sender_id INT,  -- Who triggered the notification (optional)
    type VARCHAR(50) NOT NULL,  -- 'session_reminder', 'chat_message', 'video_call'
    message TEXT NOT NULL,  -- Notification content
    status VARCHAR(10) CHECK (status IN ('unread', 'read')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE email_verification_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    
    CONSTRAINT token_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens(user_id);

DELETE FROM email_verification_tokens 
WHERE expires_at < NOW() - INTERVAL '7 days';