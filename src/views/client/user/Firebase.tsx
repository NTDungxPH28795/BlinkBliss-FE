import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";


const firebaseConfig = {
	apiKey: "AIzaSyAiVF5mqeUS53kySgJJlmmJEnP9hCJuUQ4",
	authDomain: "datn-wd-45.firebaseapp.com",
	projectId: "datn-wd-45",
	storageBucket: "datn-wd-45.appspot.com",
	messagingSenderId: "299622515988",
	appId: "1:299622515988:web:89814b5ad4a1525d042e01",
	measurementId: "G-H9P0LDS84N"
};


firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Thêm sự kiện lắng nghe khi đăng nhập thành công
auth.onAuthStateChanged((user: any) => {
	if (user) {
		console.log('User logged in:', user?.multiFactor?.user);
		// Bạn có thể thực hiện các thao tác khác với user ở đây
	} else {
		console.log('User logged out');
	}
});

export { firebase };
