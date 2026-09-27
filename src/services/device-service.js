import { getFirebase } from "./firebase-client.js";
import { currentContext } from "./store.js";
import { UserFacingError } from "./errors.js";

function verifiedUid(uid, auth) {
  const context = currentContext();
  const authUid = auth.currentUser?.uid;
  if (!authUid || authUid !== context.uid || (uid && authUid !== uid))
    throw new UserFacingError("Please sign in again to manage this device.");
  if (context.role !== "caregiver")
    throw new UserFacingError("Only a caregiver account can pair a device.");
  return authUid;
}

function normalizeDeviceId(input) {
  const deviceId = String(input || "")
    .trim()
    .toUpperCase();
  if (!deviceId)
    throw new UserFacingError("Enter the Device ID printed on your MedMate box.");
  if (!/^MEDMATE_[A-Z0-9_-]{1,55}$/.test(deviceId))
    throw new UserFacingError(
      "Enter a valid MedMate Device ID, such as MEDMATE_BOX_001.",
    );
  return deviceId;
}

export async function getDevice(deviceId, uid) {
  const { auth, db, dbSDK: sdk } = await getFirebase();
  const authUid = verifiedUid(uid, auth);
  const normalizedId = normalizeDeviceId(deviceId);
  const snapshot = await sdk.get(sdk.ref(db, `devices/${normalizedId}`));
  const device = snapshot.val();
  return device?.ownerUid === authUid && device?.paired === true
    ? { ...device, id: normalizedId }
    : null;
}

export async function getPairedDevices(uid) {
  const { auth, db, dbSDK: sdk } = await getFirebase();
  const authUid = verifiedUid(uid, auth);
  const indexSnapshot = await sdk.get(sdk.ref(db, `accounts/${authUid}/pairedDevices`));
  const index = indexSnapshot.val() || {};
  const ids = Object.entries(index)
    .filter(([, value]) => value?.paired === true)
    .map(([id]) => id);

  const devices = await Promise.all(
    ids.map((id) => getDevice(id, authUid).catch(() => null)),
  );
  return devices.filter(Boolean);
}

export async function pairDevice(deviceId, uid) {
  const { auth, db, dbSDK: sdk } = await getFirebase();
  const authUid = verifiedUid(uid, auth);
  const normalizedId = normalizeDeviceId(deviceId);

  const deviceRef = sdk.ref(db, `devices/${normalizedId}`);
  let conflict = false;
  let alreadyPaired = false;
  let result;
  try {
    result = await sdk.runTransaction(
      deviceRef,
      (current) => {
        conflict = false;
        alreadyPaired = false;
        if (current?.ownerUid && current.ownerUid !== authUid) {
          conflict = true;
          return;
        }
        if (current?.ownerUid === authUid && current.paired === true) {
          alreadyPaired = true;
          return current;
        }
        return {
          ownerUid: authUid,
          paired: true,
          pairedAt: sdk.serverTimestamp(),
        };
      },
      { applyLocally: false },
    );
  } catch (error) {
    if (["PERMISSION_DENIED", "permission-denied"].includes(error?.code))
      throw new UserFacingError("This device is already paired with another account.");
    throw error;
  }

  if (conflict)
    throw new UserFacingError("This device is already paired with another account.");
  if (!result.committed || result.snapshot.val()?.ownerUid !== authUid)
    throw new UserFacingError("Unable to pair this device. Please try again.");

  const pairedAt = result.snapshot.val()?.pairedAt || Date.now();
  await sdk.set(sdk.ref(db, `accounts/${authUid}/pairedDevices/${normalizedId}`), {
    paired: true,
    pairedAt,
  });

  return { deviceId: normalizedId, alreadyPaired };
}

export async function unpairDevice(deviceId, uid) {
  const { auth, db, dbSDK: sdk } = await getFirebase();
  const authUid = verifiedUid(uid, auth);
  const normalizedId = normalizeDeviceId(deviceId);

  const deviceRef = sdk.ref(db, `devices/${normalizedId}`);
  let notOwner = false;
  const result = await sdk.runTransaction(
    deviceRef,
    (current) => {
      notOwner = false;
      if (!current || current.ownerUid !== authUid || current.paired !== true) {
        notOwner = true;
        return;
      }
      return null;
    },
    { applyLocally: false },
  );

  if (notOwner || !result.committed)
    throw new UserFacingError("This device is no longer paired with your account.");

  await sdk.remove(sdk.ref(db, `accounts/${authUid}/pairedDevices/${normalizedId}`));
}
