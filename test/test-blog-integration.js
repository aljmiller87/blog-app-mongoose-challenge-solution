const chai =  require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const should = chai.should();
const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);

function seedBlogData() {
	const seedData = [];
	for (let i=1; i<=10; i++) {
		seedData.push(generateBlogData());
	}
	return BlogPost.insertMany(seedData);
}

function generateBlogData() {
	return {
		author: generateAuthor(),
		title: faker.name.title(),
		content: faker.lorem.sentences()
	}
}

function generateAuthor() {
	const firstNames = ['Alex', 'Bob', 'Chris', 'Dennis', 'Eric'];
	const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
	const lastNames = ['Smith', 'Jones', 'Williams', 'Miller', 'Davis'];
	const lasttName = lastNames[Math.floor(Math.random() * lastNames.length)];
	return {
		
			firstName: firstName,
			lastName: lasttName
	}
}

function tearDownDb() {
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Blog API resource', function() {
	before(function(){
		return runServer();
	});
	beforeEach(function() {
		return seedBlogData();
	});
	afterEach(function() {
		return tearDownDb();
	});
	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function(){
		it('should list items on GET', function() {
			let res;
			return chai.request(app)
			.get('/posts')
			.then(function(_res) {
				res = _res;
				res.should.be.json;
				res.body.should.be.a('array');
				res.should.have.status(200);
				res.body.length.should.be.at.least(1);
				const neededKeys = ['id', 'title', 'content', 'author', 'created'];
	      		res.body.forEach(function(item) {
	       			item.should.be.a('object');
	        		item.should.include.keys(neededKeys);
	      		})
	      		return BlogPost.count();
			})
			.then(function(count) {
				res.body.should.have.length.of(count);
			})
		})
	});

	describe('POST endpoint', function() {
		it('should create item from POST', function() {
			const newPost = generateBlogData();
			return chai.request(app)
			.post('/posts')
			.send(newPost)
			.then(function(res) {
				res.should.have.status(201);
	      		res.body.should.not.be.null;
	      		return BlogPost.findById(res.body.id);
			})
			.then(function(blogpost) {
				blogpost.title.should.equal(newPost.title);
			})
		})
	});

	describe('DELETE endpoint', function() {
		it('should remove item from DELETE', function() {
			let post;
			return BlogPost
				.findOne()
				.exec()
				.then(function(_post) {
					post = _post;
					return chai.request(app).delete(`/posts/${post.id}`);
				})
				.then(function(res) {
					res.should.have.status(204);
					return BlogPost.findById(post.id).exec();
				})
				.then(function(_post) {
					should.not.exist(_post);
				});
		});
	});

	describe('PUT endpoint', function() {
		it('should update item from PUT', function() {
			const updatedPost = {
				title: 'foooooooobar'
			};
			return BlogPost
				.findOne()
				.exec()
				.then(function(post) {
					updatedPost.id = post.id;
					return chai.request(app)
						.put(`/posts/${post.id}`)
						.send(updatedPost);
				})
				.then(function(res) {
					res.should.have.status(204);
					return BlogPost.findById(updatedPost.id).exec();
				})
				.then(function(post) {
					post.title.should.equal(updatedPost.title);
				});
		});
	});





});


