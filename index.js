var width = 320;    // We will scale the photo width to this
var height = 0;     // This will be computed based on the input stream

var streaming = false;

var video = null;
var canvas = null;
var photo = null;
var startbutton = null;

function startup() {
		video = document.getElementById('video');
		canvas = document.getElementById('canvas');
		photo = document.getElementById('photo');
		startbutton = document.getElementById('startbutton');
}

startup()

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
		.then(function(stream) {
				video.srcObject = stream;
				video.play();
		})
		.catch(function(err) {
				alert("OOPSIE DOOPSIE")
				console.error("An error occurred! " + err);
		});

video.addEventListener('canplay', function(ev){
		if (!streaming) {
				height = video.videoHeight / (video.videoWidth/width);
				streaming = true;
		}
		}, false);

startbutton.addEventListener('click', function(ev){
				takepicture();
				ev.preventDefault();
		}, false);

document.getElementById('result').addEventListener("click", e => {
		clearphoto()
})

function clearphoto() {
		var context = canvas.getContext('2d');
		context.fillStyle = "#AAA";
		context.fillRect(0, 0, canvas.width, canvas.height);

		var data = canvas.toDataURL('image/jpeg');
		photo.setAttribute('src', data);
		document.getElementById('result').style.display = "none"
}

function takepicture() {
		var context = canvas.getContext('2d');
		document.getElementById("result-text").textContent = "..."
		if (width && height) {
				canvas.width = width;
				canvas.height = height;
				context.drawImage(video, 0, 0, width, height);
				var data = canvas.toDataURL('image/jpeg');
				photo.setAttribute('src', data);
				console.log(data)
				document.getElementById('result').style.display = "block"

				fetch('/ehre-oder-mgn/upload', {
								method: 'POST',
								headers: {
										'Accept': '*',
										'Content-Type': 'image/jpeg'
								},
								body: data.split(",")[1]
						})
						.then(res => res.json())
						.then(data => {
								let coca = parseFloat(data.coca)
								let fritz = parseFloat(data.fritz)

								console.log("Coca: ", coca)
								console.log("Fritze: ", fritz)

								if (fritz > 0.5) {
										document.getElementById("result-text").textContent = `${parseInt(fritz * 100)}% EHRE`
								} else {
										document.getElementById("result-text").textContent = `${parseInt(coca * 100)}% MGN`
								}
						})

		} else {
				clearphoto();
		}
}