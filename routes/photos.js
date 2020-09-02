var express = require('express');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require("multer");
let host = "http://localhost:8888"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `${__dirname}/../albums`)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage
});


function reassignPath(tempPath, targetPath) {
  return new Promise((resolve, reject) => {
    fs.rename(tempPath, targetPath, err => {
      if (err) reject(err)
      resolve()
    });
  })
}

function deletePhoto(album, name) {
  return new Promise((resolve, reject) => {
    let dir = path.join(__dirname, `../albums/${album}/${name}`);
    fs.unlink(dir, err => {
      if (err) reject(err);
      resolve()
    });
  })
}


router.route('/')
  .put((req, res) => {
    let upload_images = upload.array("documents");
    upload_images(req, res, async (err) => {
      let actions = [], data = []
      req.files.forEach(file => {
        data.push({
          album: req.body.album,
          name: file.filename,
          path: `/albums/${req.body.album.toLowerCase()}/${file.filename}`,
          raw: `${host}/${req.body.album.toLowerCase()}/${file.filename}`
        })
        actions.push(reassignPath(file.path, `${__dirname}/../albums/${req.body.album.toLowerCase()}/${file.filename}`))
      })
      await Promise.all(actions);
      res.json({
        message: "OK",
        data
      })
    })
  })
  .delete(async (req, res) => {
    let actions = []
    req.body.forEach(({ album, documents }) => {
      let docs = documents.split(',');
      docs.forEach(name => actions.push(deletePhoto(album, name.trim())))
    })
    await Promise.all(actions)
    res.status(200).json({ message: "OK" })
  })


function getFiles(_path) {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, _path);
    fs.readdir(dir, (err, data) => {
      resolve(data ? { data, path: _path } : {})
    })
  })
}

router.route('/list')
  .post(async (req, res) => {
    let files = await getFiles('../albums');
    let actions = [], albums = []
    files.data.forEach((album) => {
      albums.push({
        album,
        _path: `../albums/${album}`
      })
      actions.push(getFiles(`../albums/${album}`))
    })
    let images = await Promise.all(actions)
    let documents = [];
    albums.forEach(({ album, _path }) => {
      let data = images.find(v => v.path === _path);
      data.data.forEach((name, i) => {
        documents.push({
          id: `${album}_${i}`,
          album,
          name,
          path: `/albums/${album}/${name}`,
          raw: `${host}/photos/${album}/${name}`
        })
      })
    })
    let skip = req.body.skip || 0;
    let limit = req.body.limit || 10;
    let sliced_documents = documents.slice(skip, (skip + limit))
    res.json({ message: "OK", documents: sliced_documents, count: documents.length, skip, limit })
  })


router.route('/:album/:name')
  .get(async (req, res) => {
    res.sendFile(path.join(__dirname, `../albums/${req.params.album}/${req.params.name}`))
  })
  .delete(async (req, res) => {
    await deletePhoto(req.params.album, req.params.name);
    res.status(200).json({ message: "OK" })
  })

module.exports = router;
