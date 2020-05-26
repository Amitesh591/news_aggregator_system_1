process.env.NODE_ENV = 'test';

let mongoose = require("mongoose");
let Book = require('../models/rssModel');

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app.js');
let should = chai.should();

chai.use(chaiHttp);

describe('Feeds', () => {
/*
  * Test the /GET route
  */
  describe('/GET feeds', () => {
      it('it should GET all the feeds', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                  res.should.have.status(200);
                  //res.body.length.should.be.eql(0);
              done();
            });
      });
  });

  describe('/GET customize', () => {
      it('it should GET customize page', (done) => {
        chai.request(server)
            .get('/customize')
            .end((err, res) => {
                  res.should.have.status(200);
                  //res.body.length.should.be.eql(0);
              done();
            });
      });
  });

  /*
  * Test the /POST route
  */
  describe('/POST search query', () => {
      it('it should POST a query to search in the database', (done) => {
          let qq = {
              query: "coronavirus"
          }
        chai.request(server)
            .post('/search')
            .send(qq)
            .end((err, res) => {
                  res.should.have.status(200); done();
            });
      });
   });

  describe('/POST customize query', () => {
      it('it should POST a query to customize and retrieve data from the database', (done) => {
          let qq = {
              agencies: 'BBC,Times of India,Hindustan Times'
          }
        chai.request(server)
            .post('/retrieveCustomized')
            .send(qq)
            .end((err, res) => {
                  res.should.have.status(200); done();
            });
      });
   });


});