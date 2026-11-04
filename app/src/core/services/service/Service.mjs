import { auth, database, storage } from '../../../core/config/firebase.config.mjs'

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth'

import {
    ref as dbRef,
    set,
    get,
    update,
    remove,
    onValue,
    query,
    child,
    orderByKey,
    startAfter,
    limitToFirst
} from 'firebase/database'

import {
    ref as storageRef,
    uploadBytes,
    deleteObject,
    getDownloadURL
} from 'firebase/storage'


export class Service {

    // Auth

    static async signUp(email, password) {
        const credenciales = await createUserWithEmailAndPassword(auth, email, password)
        return credenciales.user
    }

    static async signIn(email, password) {
        const credenciales = await signInWithEmailAndPassword(auth, email, password)
        return credenciales.user
    }

    static async signOut() {
        await signOut(auth)
    }

    static getSignedUser() {
        return auth.currentUser
    }

    static async updateSignedUser(data) {
        const user = auth.currentUser;

        if (!user) {
            return false
        }

        try {
            await updateProfile(user, data)
            return true
        } catch (error) {
            return false
        }
    }

    static onSignChanged(callback) {
        return onAuthStateChanged(auth, (user) => {
            callback(user)
        })
    }

    static async singInWithGoogle() {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        return result.user
    }

    // Realtime Database

    static async setData(path, data) {
        await set(dbRef(database, path), data)
    }

    static async getData(path) {
        return await get(
            query(
                child(dbRef(database), path),
                orderByKey()
            )
        )
            .then((snapshot) => {
                if (snapshot.exists()) {
                    return snapshot.val()
                } else {
                    return undefined
                }
            })
            .catch((error) => {
                console.log(error)
                return null
            })
    }

    static async removeData(patch) {
        await remove(dbRef(database, patch))
    }

    static async updateData(path, data) {
        const updates = {}
        updates[path] = data
        await update(dbRef(database), updates)
    }

    static onGetData(path, callback) {
        onValue(dbRef(database, path), (snapshot) => {
            const data = snapshot.exists() ? snapshot.val() : null
            callback(data)
        })
    }

    static async getDataPaged(path, last, pageSize) {
        const dbRef = ref(db)
        try {
            const snapshot = await get(
                query(
                    child(dbRef, path),
                    orderByKey(),
                    startAfter(String(last)),
                    limitToFirst(pageSize)
                )
            )
            if (snapshot.exists()) {
                return snapshot.val()
            } else {
                return undefined
            }
        } catch (error) {
            console.log(error)
            return null
        }
    }

    // Storage

    static async uploadFile(path, file) {
        const ref = storageRef(storage, path)
        try {
            await uploadBytes(ref, file)
            return await getDownloadURL(ref)
        }
        catch (error) {
            return null
        }
    }

    static async deleteFile(path) {
        const ref = storageRef(storage, path)
        try {
            await deleteObject(ref)
            return true
        }
        catch (error) {
            return false
        }
    }

}

export default Service