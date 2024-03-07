export function getScreenViewHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Screen View</title>
    <script>
        var socket = null;

        function connectWebsocket() {
            // tries to connect to a websocket server at localhost:2035. If it fails, it should try again every 5 seconds
            socket = new WebSocket("ws://localhost:2035/ws");
            socket.addEventListener('error', function (event) {
                //console.log("Failed to connect to emulator");
                socket.close();
                return;
            });
            socket.addEventListener('close', function (event) {
                //console.log("Disconnected from emulator");
                setTimeout(connectWebsocket, 1000);
                return;
            });
            socket.addEventListener('open', function (event) {
                //console.log("Connected to emulator");
            });
            socket.addEventListener('message', function (event) {
                let data = JSON.parse(event.data);
                console.log("message recieved! width:", data.width, "height:", data.height, "updates:", data.updates.length);
                let canvas = document.getElementById("screen");

                if (canvas.width != data.width || canvas.height != data.height) {
                    canvas.width = data.width;
                    canvas.height = data.height;
                }

                let ctx = canvas.getContext("2d");
                ctx.willReadFrequently = true;

                for (let update of data.updates) {
                    let x = update.region_x;
                    let y = update.region_y;
                    let imageData = ctx.getImageData(x, y, 16, 16);

                    for (let i = 0; i < 16; i++) {
                        for (let j = 0; j < 16; j++) {
                            let index = (i * 16 + j) * 4;
                            imageData.data[index] = update.data[i * 16 + j] & 0xFF; // red
                            imageData.data[index + 1] = (update.data[i * 16 + j] >> 8) & 0xFF; // green
                            imageData.data[index + 2] = (update.data[i * 16 + j] >> 16) & 0xFF; // blue
                            imageData.data[index + 3] = 0xFF; // alpha
                        }
                    }

                    ctx.putImageData(imageData, x, y);
                }

                console.log("ack");
                socket.send(JSON.stringify({ack: true}));
            });
        }

        if (socket == null) {
            connectWebsocket();
        }
    </script>
</head>
<body>
        <canvas id="screen" width="320" height="320"></canvas>
</body>
</html>`;
}