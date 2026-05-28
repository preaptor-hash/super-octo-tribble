// ============================================================
// HRMS Flutter - Data Models
// Mirrors the TypeScript types from the React app
// ============================================================

enum UserRole { superAdmin, organizationAdmin, branchManager, recruiter, viewer }

enum WorkerStatus { active, inactive, draft, deployed, blacklisted, unavailable }

enum RecruitmentStage {
  newEntry,
  contacted,
  interested,
  verificationPending,
  readyToJoin,
  deployed,
  rejected
}

enum AttendanceType { present, absent, leave, halfDay, late }

enum DeploymentStatus { active, completed, cancelled }

// ─── User ────────────────────────────────────────────────────
class AppUser {
  final String id;
  final String email;
  final String? fullName;
  final UserRole role;
  final String? organizationId;
  final String? branchId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AppUser({
    required this.id,
    required this.email,
    this.fullName,
    required this.role,
    this.organizationId,
    this.branchId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'],
        email: j['email'],
        fullName: j['full_name'],
        role: _parseUserRole(j['role']),
        organizationId: j['organization_id'],
        branchId: j['branch_id'],
        createdAt: DateTime.parse(j['created_at']),
        updatedAt: DateTime.parse(j['updated_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role.name,
        'organization_id': organizationId,
        'branch_id': branchId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  static UserRole _parseUserRole(String? s) {
    switch (s) {
      case 'super_admin': return UserRole.superAdmin;
      case 'organization_admin': return UserRole.organizationAdmin;
      case 'branch_manager': return UserRole.branchManager;
      case 'viewer': return UserRole.viewer;
      default: return UserRole.recruiter;
    }
  }

  String get roleLabel {
    switch (role) {
      case UserRole.superAdmin: return 'Super Admin';
      case UserRole.organizationAdmin: return 'Org Admin';
      case UserRole.branchManager: return 'Branch Manager';
      case UserRole.recruiter: return 'Recruiter';
      case UserRole.viewer: return 'Viewer';
    }
  }
}

// ─── Area ────────────────────────────────────────────────────
class Area {
  final String id;
  final String name;
  final String? pincode;
  final double? latitude;
  final double? longitude;
  final String? zone;
  final DateTime createdAt;

  const Area({
    required this.id,
    required this.name,
    this.pincode,
    this.latitude,
    this.longitude,
    this.zone,
    required this.createdAt,
  });

  factory Area.fromJson(Map<String, dynamic> j) => Area(
        id: j['id'],
        name: j['name'],
        pincode: j['pincode'],
        latitude: j['latitude'] != null ? (j['latitude'] as num).toDouble() : null,
        longitude: j['longitude'] != null ? (j['longitude'] as num).toDouble() : null,
        zone: j['zone'],
        createdAt: DateTime.parse(j['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'pincode': pincode,
        'latitude': latitude,
        'longitude': longitude,
        'zone': zone,
        'created_at': createdAt.toIso8601String(),
      };

  Area copyWith({
    String? name,
    String? pincode,
    double? latitude,
    double? longitude,
    String? zone,
  }) =>
      Area(
        id: id,
        name: name ?? this.name,
        pincode: pincode ?? this.pincode,
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        zone: zone ?? this.zone,
        createdAt: createdAt,
      );
}

// ─── GpsLocation ─────────────────────────────────────────────
class GpsLocation {
  final double latitude;
  final double longitude;

  const GpsLocation({required this.latitude, required this.longitude});

  factory GpsLocation.fromJson(Map<String, dynamic> j) => GpsLocation(
        latitude: (j['latitude'] as num).toDouble(),
        longitude: (j['longitude'] as num).toDouble(),
      );

  Map<String, dynamic> toJson() => {'latitude': latitude, 'longitude': longitude};
}

// ─── Worker ──────────────────────────────────────────────────
class Worker {
  final String id;
  final String? internalId;
  final String? fullName;
  final String? phone;
  final String? alternatePhone;
  final String? gender;
  final int? age;
  final String? profilePhotoUrl;
  final WorkerStatus? workerStatus;
  final RecruitmentStage? recruitmentStage;
  final String? skillCategory;
  final int? experienceYears;
  final double? salaryExpected;
  final String? city;
  final String? areaId;
  final String? pincode;
  final GpsLocation? location;
  final String? availability;
  final String? shiftPreference;
  final String? aadhaarNumber;
  final String? panNumber;
  final String? notes;
  final String? assignedRecruiterId;
  final String? branchId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Worker({
    required this.id,
    this.internalId,
    this.fullName,
    this.phone,
    this.alternatePhone,
    this.gender,
    this.age,
    this.profilePhotoUrl,
    this.workerStatus,
    this.recruitmentStage,
    this.skillCategory,
    this.experienceYears,
    this.salaryExpected,
    this.city,
    this.areaId,
    this.pincode,
    this.location,
    this.availability,
    this.shiftPreference,
    this.aadhaarNumber,
    this.panNumber,
    this.notes,
    this.assignedRecruiterId,
    this.branchId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Worker.fromJson(Map<String, dynamic> j) => Worker(
        id: j['id'],
        internalId: j['internal_id'],
        fullName: j['full_name'],
        phone: j['phone'],
        alternatePhone: j['alternate_phone'],
        gender: j['gender'],
        age: j['age'],
        profilePhotoUrl: j['profile_photo_url'],
        workerStatus: _parseWorkerStatus(j['worker_status']),
        recruitmentStage: _parseRecruitmentStage(j['recruitment_stage']),
        skillCategory: j['skill_category'],
        experienceYears: j['experience_years'],
        salaryExpected: j['salary_expected'] != null ? (j['salary_expected'] as num).toDouble() : null,
        city: j['city'],
        areaId: j['area_id'],
        pincode: j['pincode'],
        location: j['location'] != null ? GpsLocation.fromJson(j['location']) : null,
        availability: j['availability'],
        shiftPreference: j['shift_preference'],
        aadhaarNumber: j['aadhaar_number'],
        panNumber: j['pan_number'],
        notes: j['notes'],
        assignedRecruiterId: j['assigned_recruiter_id'],
        branchId: j['branch_id'],
        createdAt: DateTime.parse(j['created_at']),
        updatedAt: DateTime.parse(j['updated_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'internal_id': internalId,
        'full_name': fullName,
        'phone': phone,
        'alternate_phone': alternatePhone,
        'gender': gender,
        'age': age,
        'profile_photo_url': profilePhotoUrl,
        'worker_status': workerStatus?.name,
        'recruitment_stage': recruitmentStage?.name,
        'skill_category': skillCategory,
        'experience_years': experienceYears,
        'salary_expected': salaryExpected,
        'city': city,
        'area_id': areaId,
        'pincode': pincode,
        'location': location?.toJson(),
        'availability': availability,
        'shift_preference': shiftPreference,
        'aadhaar_number': aadhaarNumber,
        'pan_number': panNumber,
        'notes': notes,
        'assigned_recruiter_id': assignedRecruiterId,
        'branch_id': branchId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  Worker copyWith({
    String? internalId,
    String? fullName,
    String? phone,
    String? alternatePhone,
    String? gender,
    int? age,
    String? profilePhotoUrl,
    WorkerStatus? workerStatus,
    RecruitmentStage? recruitmentStage,
    String? skillCategory,
    int? experienceYears,
    double? salaryExpected,
    String? city,
    String? areaId,
    String? pincode,
    GpsLocation? location,
    String? availability,
    String? shiftPreference,
    String? aadhaarNumber,
    String? panNumber,
    String? notes,
    String? assignedRecruiterId,
    String? branchId,
    DateTime? updatedAt,
  }) =>
      Worker(
        id: id,
        internalId: internalId ?? this.internalId,
        fullName: fullName ?? this.fullName,
        phone: phone ?? this.phone,
        alternatePhone: alternatePhone ?? this.alternatePhone,
        gender: gender ?? this.gender,
        age: age ?? this.age,
        profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
        workerStatus: workerStatus ?? this.workerStatus,
        recruitmentStage: recruitmentStage ?? this.recruitmentStage,
        skillCategory: skillCategory ?? this.skillCategory,
        experienceYears: experienceYears ?? this.experienceYears,
        salaryExpected: salaryExpected ?? this.salaryExpected,
        city: city ?? this.city,
        areaId: areaId ?? this.areaId,
        pincode: pincode ?? this.pincode,
        location: location ?? this.location,
        availability: availability ?? this.availability,
        shiftPreference: shiftPreference ?? this.shiftPreference,
        aadhaarNumber: aadhaarNumber ?? this.aadhaarNumber,
        panNumber: panNumber ?? this.panNumber,
        notes: notes ?? this.notes,
        assignedRecruiterId: assignedRecruiterId ?? this.assignedRecruiterId,
        branchId: branchId ?? this.branchId,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  int get profileCompletionPercent =>
      (fullName != null ? 20 : 0) +
      (phone != null ? 20 : 0) +
      (age != null ? 15 : 0) +
      (skillCategory != null ? 15 : 0) +
      (aadhaarNumber != null ? 15 : 0) +
      (profilePhotoUrl != null ? 15 : 0);

  static WorkerStatus? _parseWorkerStatus(String? s) {
    switch (s) {
      case 'active': return WorkerStatus.active;
      case 'inactive': return WorkerStatus.inactive;
      case 'draft': return WorkerStatus.draft;
      case 'deployed': return WorkerStatus.deployed;
      case 'blacklisted': return WorkerStatus.blacklisted;
      case 'unavailable': return WorkerStatus.unavailable;
      default: return null;
    }
  }

  static RecruitmentStage? _parseRecruitmentStage(String? s) {
    switch (s) {
      case 'new': return RecruitmentStage.newEntry;
      case 'contacted': return RecruitmentStage.contacted;
      case 'interested': return RecruitmentStage.interested;
      case 'verification_pending': return RecruitmentStage.verificationPending;
      case 'ready_to_join': return RecruitmentStage.readyToJoin;
      case 'deployed': return RecruitmentStage.deployed;
      case 'rejected': return RecruitmentStage.rejected;
      default: return null;
    }
  }
}

// ─── Attendance ───────────────────────────────────────────────
class Attendance {
  final String id;
  final String workerId;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final AttendanceType type;
  final GpsLocation? gpsLocation;
  final String? selfieUrl;
  final String? notes;
  final DateTime createdAt;

  const Attendance({
    required this.id,
    required this.workerId,
    this.checkInTime,
    this.checkOutTime,
    required this.type,
    this.gpsLocation,
    this.selfieUrl,
    this.notes,
    required this.createdAt,
  });

  factory Attendance.fromJson(Map<String, dynamic> j) => Attendance(
        id: j['id'],
        workerId: j['worker_id'],
        checkInTime: j['check_in_time'] != null ? DateTime.parse(j['check_in_time']) : null,
        checkOutTime: j['check_out_time'] != null ? DateTime.parse(j['check_out_time']) : null,
        type: _parseType(j['type']),
        gpsLocation: j['gps_location'] != null ? GpsLocation.fromJson(j['gps_location']) : null,
        selfieUrl: j['selfie_url'],
        notes: j['notes'],
        createdAt: DateTime.parse(j['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'worker_id': workerId,
        'check_in_time': checkInTime?.toIso8601String(),
        'check_out_time': checkOutTime?.toIso8601String(),
        'type': type.name,
        'gps_location': gpsLocation?.toJson(),
        'selfie_url': selfieUrl,
        'notes': notes,
        'created_at': createdAt.toIso8601String(),
      };

  Attendance copyWith({DateTime? checkOutTime}) => Attendance(
        id: id,
        workerId: workerId,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime ?? this.checkOutTime,
        type: type,
        gpsLocation: gpsLocation,
        selfieUrl: selfieUrl,
        notes: notes,
        createdAt: createdAt,
      );

  static AttendanceType _parseType(String? s) {
    switch (s) {
      case 'absent': return AttendanceType.absent;
      case 'leave': return AttendanceType.leave;
      case 'half_day': return AttendanceType.halfDay;
      case 'late': return AttendanceType.late;
      default: return AttendanceType.present;
    }
  }
}

// ─── NotesTimeline ────────────────────────────────────────────
class NoteEntry {
  final String id;
  final String workerId;
  final String userId;
  final String noteContent;
  final DateTime createdAt;

  const NoteEntry({
    required this.id,
    required this.workerId,
    required this.userId,
    required this.noteContent,
    required this.createdAt,
  });

  factory NoteEntry.fromJson(Map<String, dynamic> j) => NoteEntry(
        id: j['id'],
        workerId: j['worker_id'],
        userId: j['user_id'],
        noteContent: j['note_content'],
        createdAt: DateTime.parse(j['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'worker_id': workerId,
        'user_id': userId,
        'note_content': noteContent,
        'created_at': createdAt.toIso8601String(),
      };
}

// ─── WorkerDocument ───────────────────────────────────────────
class WorkerDocument {
  final String id;
  final String workerId;
  final String documentType;
  final String fileUrl;
  final String uploadedBy;
  final DateTime createdAt;

  const WorkerDocument({
    required this.id,
    required this.workerId,
    required this.documentType,
    required this.fileUrl,
    required this.uploadedBy,
    required this.createdAt,
  });

  factory WorkerDocument.fromJson(Map<String, dynamic> j) => WorkerDocument(
        id: j['id'],
        workerId: j['worker_id'],
        documentType: j['document_type'],
        fileUrl: j['file_url'],
        uploadedBy: j['uploaded_by'],
        createdAt: DateTime.parse(j['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'worker_id': workerId,
        'document_type': documentType,
        'file_url': fileUrl,
        'uploaded_by': uploadedBy,
        'created_at': createdAt.toIso8601String(),
      };
}

// ─── Deployment ───────────────────────────────────────────────
class Deployment {
  final String id;
  final String workerId;
  final String? clientName;
  final String? deploymentLocation;
  final String? shift;
  final String? joiningDate;
  final DeploymentStatus? deploymentStatus;
  final DateTime createdAt;

  const Deployment({
    required this.id,
    required this.workerId,
    this.clientName,
    this.deploymentLocation,
    this.shift,
    this.joiningDate,
    this.deploymentStatus,
    required this.createdAt,
  });

  factory Deployment.fromJson(Map<String, dynamic> j) => Deployment(
        id: j['id'],
        workerId: j['worker_id'],
        clientName: j['client_name'],
        deploymentLocation: j['deployment_location'],
        shift: j['shift'],
        joiningDate: j['joining_date'],
        deploymentStatus: _parseStatus(j['deployment_status']),
        createdAt: DateTime.parse(j['created_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'worker_id': workerId,
        'client_name': clientName,
        'deployment_location': deploymentLocation,
        'shift': shift,
        'joining_date': joiningDate,
        'deployment_status': deploymentStatus?.name,
        'created_at': createdAt.toIso8601String(),
      };

  Deployment copyWith({DeploymentStatus? deploymentStatus}) => Deployment(
        id: id,
        workerId: workerId,
        clientName: clientName,
        deploymentLocation: deploymentLocation,
        shift: shift,
        joiningDate: joiningDate,
        deploymentStatus: deploymentStatus ?? this.deploymentStatus,
        createdAt: createdAt,
      );

  static DeploymentStatus? _parseStatus(String? s) {
    switch (s) {
      case 'active': return DeploymentStatus.active;
      case 'completed': return DeploymentStatus.completed;
      case 'cancelled': return DeploymentStatus.cancelled;
      default: return null;
    }
  }
}
