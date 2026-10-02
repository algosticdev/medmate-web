import { writeFileSync } from "node:fs";
// Keep the emitted database.rules.json in source control and deploy that file.
const integer = (max) => ({
  ".validate": `newData.isNumber() && newData.val() >= 0 && newData.val() <= ${max} && newData.val() % 1 == 0`,
});
const timestamp = { ".validate": "newData.isNumber() && newData.val() > 0" };
const string = (max) => ({
  ".validate": `newData.isString() && newData.val().length > 0 && newData.val().length <= ${max}`,
});
const role =
  "auth != null && auth.uid == $uid && (root.child('users').child(auth.uid).child('role').val() == 'caregiver' || root.child('users').child(auth.uid).child('role').val() == 'admin')";
const scheduleFields = {
  medicineId: string(128),
  medicineName: string(100),
  scheduledTime: {
    ".validate":
      "newData.isString() && newData.val().matches(/^([01][0-9]|2[0-3]):[0-5][0-9]$/)",
  },
  compartmentId: {
    ".validate":
      "newData.isString() && newData.val().matches(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-(A|B)$/)",
  },
  onTimeWindow: integer(1440),
  gracePeriod: integer(1440),
  active: { ".validate": "newData.isBoolean()" },
  createdAt: timestamp,
  updatedAt: timestamp,
  $other: { ".validate": false },
};
const scheduleRequired =
  "newData.hasChildren(['medicineId','medicineName','scheduledTime','compartmentId','onTimeWindow','gracePeriod','active','createdAt','updatedAt']) && newData.child('updatedAt').val() >= newData.child('createdAt').val()";
const rules = {
  rules: {
    ".read": false,
    ".write": false,
    users: {
      ".read":
        "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'",
      $uid: {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid && !data.exists()",
        ".validate": "newData.hasChildren(['role','name','email','createdAt'])",
        role: { ".validate": "newData.val() == 'caregiver'" },
        name: string(100),
        email: {
          ".validate":
            "newData.isString() && newData.val() == auth.token.email && newData.val().length <= 254",
        },
        createdAt: timestamp,
        $other: { ".validate": false },
      },
    },
    feedback: {
      ".read":
        "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'",
      $id: {
        ".write":
          "auth != null && ((!data.exists() && newData.exists() && newData.child('userId').val() == auth.uid && newData.child('email').val() == auth.token.email && newData.child('status').val() == 'NEW' && !newData.child('reviewedAt').exists() && !newData.child('reviewedBy').exists()) || (data.exists() && newData.exists() && root.child('users').child(auth.uid).child('role').val() == 'admin' && newData.child('userId').val() == data.child('userId').val() && newData.child('name').val() == data.child('name').val() && newData.child('email').val() == data.child('email').val() && newData.child('subject').val() == data.child('subject').val() && newData.child('message').val() == data.child('message').val() && newData.child('createdAt').val() == data.child('createdAt').val() && newData.child('status').val() == 'REVIEWED' && newData.child('reviewedBy').val() == auth.uid && newData.child('reviewedAt').isNumber()))",
        ".validate":
          "newData.hasChildren(['userId','name','email','subject','message','status','createdAt'])",
        userId: string(128),
        name: string(100),
        email: string(254),
        subject: string(120),
        message: string(2000),
        status: { ".validate": "newData.val() == 'NEW' || newData.val() == 'REVIEWED'" },
        createdAt: timestamp,
        reviewedAt: timestamp,
        reviewedBy: string(128),
        $other: { ".validate": false },
      },
    },
    accounts: {
      $uid: {
        ".read": role,
        catalog: {
          ".write": role,
          medicines: {
            $id: {
              ".validate":
                "newData.hasChildren(['name','currentStock','minimumStock','createdAt','updatedAt']) && newData.child('updatedAt').val() >= newData.child('createdAt').val()",
              name: string(100),
              currentStock: integer(1000000),
              minimumStock: integer(1000000),
              createdAt: timestamp,
              updatedAt: timestamp,
              $other: { ".validate": false },
            },
          },
          schedules: {
            $id: {
              ".validate": `${scheduleRequired} && newData.parent().parent().child('medicines').child(newData.child('medicineId').val()).exists()`,
              ...scheduleFields,
            },
          },
          scheduleVersions: {
            $id: {
              $revision: { ".validate": scheduleRequired, ...scheduleFields },
            },
          },
          stockAlerts: {
            $medicineId: {
              ".validate": "newData.hasChildren(['id','alertType','medicineId','medicineName','currentStock','minimumStock','timestamp','source'])",
              id: string(180),
              alertType: {
                ".validate": "newData.val() == 'LOW_STOCK' || newData.val() == 'REFILL_REQUIRED'",
              },
              medicineId: string(128),
              medicineName: string(100),
              currentStock: integer(1000000),
              minimumStock: integer(1000000),
              timestamp,
              source: { ".validate": "newData.val() == 'stock'" },
              $other: { ".validate": false },
            },
          },
          $other: { ".validate": false },
        },
        caregiver: {
          ".write": role,
          ".validate":
            "newData.hasChildren(['name','email','notificationPreference','notificationsEnabled','eventCategories','updatedAt'])",
          name: string(100),
          email: {
            ".validate":
              "auth.token.email_verified == true && newData.isString() && newData.val() == auth.token.email && newData.val().length <= 254",
          },
          phoneNumber: {
            ".validate":
              "newData.isString() && newData.val() == auth.token.phone_number && newData.val().matches(/^\\+[1-9][0-9]{7,14}$/)",
          },
          notificationPreference: {
            ".validate":
              "newData.val() == 'in_app' || newData.val() == 'email'",
          },
          notificationsEnabled: { ".validate": "newData.isBoolean()" },
          emailNotificationsEnabled: { ".validate": "newData.isBoolean()" },
          eventCategories: {
            ".validate": "newData.hasChildren(['MISSED','WRONG_COMPARTMENT'])",
            MISSED: { ".validate": "newData.val() == true" },
            WRONG_COMPARTMENT: { ".validate": "newData.val() == true" },
            $other: { ".validate": false },
          },
          updatedAt: timestamp,
          $other: { ".validate": false },
        },
        alertReads: {
          $id: {
            ".write": role,
            ".validate": "newData.isBoolean() && newData.val() == true",
          },
        },
        events: {
          ".write": false,
          ".indexOn": [
            "timestamp",
            "scheduledDate",
            "medicineId",
            "compartmentId",
            "eventType",
          ],
          $eventId: {
            notificationDelivery: { ".write": role },
            caregiverNotification: {
              ".write": role,
              ".validate": "newData.isBoolean()",
            },
            caregiverNotificationStatus: {
              ".write": role,
              ".validate":
                "newData.val() == 'SENT' || newData.val() == 'FAILED' || newData.val() == 'NOT_REQUIRED'",
            },
          },
        },
        alerts: { ".write": false, ".indexOn": ["timestamp"] },
        devices: { ".write": false },
        compartments: { ".write": false },
        $other: { ".validate": false },
      },
    },
  },
};
writeFileSync(
  new URL("../database.rules.json", import.meta.url),
  JSON.stringify(rules, null, 2) + "\n",
);
