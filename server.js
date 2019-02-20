const http = require('http')
const formidable = require('formidable')
const fs = require('fs')
const spawn = require("child_process").spawn;

http.createServer(function (req, res) {
  if (req.url == '/fileupload') {
    const form = new formidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
      const oldpath = files.filetoupload.path
      const newpath = __dirname + '/image.jpg'

      fs.readFile(oldpath, function (err, data) {
        if (err) throw err
        console.log('File read!')

        // Write the file
        fs.writeFile(newpath, data, function (err) {
            if (err) throw err
            console.log('File written!')
            const pythonProcess = spawn('python',[__dirname + '/label_image.py']);
            pythonProcess.stdout.on('data', (data) => {
                console.log(data)
            });
            pythonProcess.on('close', code => {
                console.log("closed", code)
            })
            res.write('File uploaded and moved!')
            res.end()
        })

        // Delete the file
        fs.unlink(oldpath, function (err) {
            if (err) throw err
            console.log('File deleted!')
        })
    })
 })
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">')
    res.write('<input type="file" name="filetoupload"><br>')
    res.write('<input type="submit">')
    res.write('</form>')
    return res.end()
  }
}).listen(8080)