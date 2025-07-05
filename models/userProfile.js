// models/UserProfile.js
class UserProfile {
  constructor(data) {
    this.userId = data.user_id;
    this.name = data.name;
    this.email = data.email;
    this.gender = data.gender;
    this.phoneNumber = data.phone_number;
    this.dateOfBirth = data.date_of_birth;
    this.profilePicture = data.profile_picture;
    this.isActive = data.is_active;
    this.roleName = data.role_name;

    // Therapist specific fields
    if (data.role_name === 'Therapist') {
      this.therapistId = data.therapist_id;
      this.licenseNumber = data.license_number;
      this.specialization = data.specialization;
      this.experienceYears = data.experience_years;
      this.bio = data.bio;
      this.status = data.status;
      this.isVerified = data.is_verified;
      this.cancellationCount = data.cancellation_count;
    }

    // Client specific fields
    if (data.role_name === 'Client') {
      this.clientId = data.client_id;
      this.therapyGoals = data.therapy_goals;
      this.preferredTherapyType = data.preferred_therapy_type;
    }
  }

  // Method to check if the user is a therapist
  isTherapist() {
    return this.roleName === 'Therapist';
  }

  // Method to check if the user is a client
  isClient() {
    return this.roleName === 'Client';
  }
}

module.exports = UserProfile;