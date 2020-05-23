
# CC-Assignment-2
## Steam Review Analyzer

This application uses Google Cloud Natural Language API analyzeEntitySentiment method to coalesce many steam reviews into one easily digestible chunk. 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

```
AWS CLI https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-using.html
```
```
Node JS https://nodejs.org/en/download/
```
```
MySQL Server and MySQL Workbench https://dev.mysql.com/downloads/installer/
```

### Installing


#### Getting a Google Cloud Natural Language API Key

1. Follow the steps on the [Google Cloud Docs](https://cloud.google.com/natural-language/docs/quickstart) to get your GOOGLE_APPLICATION_CREDENTIALS
2. Create a .env file in the /backend/development directory with the following values

```
PROJECT_ID=YOUR PROJECT ID
CLIENT_EMAIL=YOUR CLIENT EMAIL
PRIVATE_KEY=YOUR PRIVATE KEY
```


#### Setting up a local MySQL Database

1. Follow the [steps](https://dev.mysql.com/doc/workbench/en/wb-getting-started-tutorial-create-connection.html) to create a local MySQL database
2. Run the following query to create the MySQL table
```
CREATE SCHEMA IF NOT EXISTS applistschema;

CREATE TABLE IF NOT EXISTS applistschema.`applist` (
  `appid` INT NOT NULL,
  `appname` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`appid`));

```
3. Add the following to the .env file you just created

```
HOST=localhost
USERNAME=YOUR SQL USERNAME
PASSWORD=YOUR SQL PASSWORD
PORT=YOUR MYSQL PORT
```


#### Install the node modules

1. Open a Command Line Terminal and go to the clonedrepo/backend/development directory (if on Windows you can click on the file address bar and type cmd)
2. Type `npm install` to install node modules for the backend express server
3. Now type `cd ../../frontend` 
4. Type `npm install` to install node modules for the frontend 


#### Run the application

1. In the same Command Line Terminal, navigate to the frontend folder if you aren't already there
2. Type `npm start` to start the frontend in development mode
3. Then navigate to the development directory by typing `cd ../backend/development`
4. Type node app.js to start the backend 
Note that it will take a while for the backend server to populate the MySQL database with the Steam Apps

#### Test the application
1. On the website at `localhost:3000` navigate to the search box. 
2. Type in any game title
3. If installation was successful, you should see a page that looks something like this:
![](https://imgur.com/a/M9JT3Z9)

## Deployment

We will deploy this app to AWS cloud using several AWS microservices.

#### Hosting the static website on S3
1. Follow the instructions on [Amazon AWS Docs](https://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html) to create your S3 bucket
2. Configure your AWS CLI by following these [instructions](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
3. Go to your /frontend directory and open the package.json file 
4. Replace `your-bucket-name-here` with the name of your S3 bucket
5. Open a Command Line Terminal and navigate to your frontend folder
6. Type `npm run build`
7. Then once that is complete type `npm run deploy`
This will upload the built website to your S3 bucket.
8. Follow these [instructions](https://docs.aws.amazon.com/AmazonS3/latest/user-guide/static-website-hosting.html#test-your-website-endpoint) to make the S3 bucket host the website

#### Setting up your RDS Database
1. Follow these [instructions](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Tutorials.WebServerDB.CreateDBInstance.html) to create your RDS database (Make sure to choose MySQL)
2. Open MySQL dashboard and connect to the RDS database using the username, password, endpoint and port.
3. Run the following query
```
CREATE SCHEMA IF NOT EXISTS applistschema;

CREATE TABLE IF NOT EXISTS applistschema.`applist` (
  `appid` INT NOT NULL,
  `appname` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`appid`));
```
4. Replace the environment variables in `backend/development` with
```
HOST=YOUR RDS ENDPOINT
USERNAME=YOUR RDS USERNAME
PASSWORD=YOUR RDS PASSWORD
PORT=YOUR RDS PORT
```
 5. Run the backend server from the command line terminal using `node app.js`
 This will start populating the database. Keep this running while you set up the other services.

#### Making the AWS Lambda Functions
1. Go to your [AWS Lambda Console](https://ap-southeast-2.console.aws.amazon.com/lambda/) 
2. Create a function called `get-suggestions-from-input`
3. Under function code select the code entry type drop down and click `Upload a .zip file`
4. Navigate to `repolocation/backend/lambdafunctions`
5. Select the `get-suggestions-from-input.zip` file and hit open
6. Click the orange save button in the top right corner
7. Under environment variables click edit
8. Add environment variables
```
database	applistschema
host 		THERDSENDPOINT
password	THERDSPASSWORD
port		THERDSPORT
username	THERDSUSERNAME
```
9. Hit save
10. Follow these [instructions ](https://aws.amazon.com/premiumsupport/knowledge-center/internet-access-lambda-function/) to give internet access to the lambda function

11. Do this for the other two .zip file in lambdafunctions folder

#### Setting up Amazon API Gateway
##### Creating the API Gateway
1. Click Create API 
2. Click build in the REST API box
3. Under choose protocol, choose REST
4. Under settings set the API name to `steam-review-analyzer`
5. Click create API
6. On the left navigation, click actions and select Create Resource
7. Set resource name to `autocomplete`
8. Check Enable API Gateway CORS 
9. Click Create Resource
10. Create another Resource and name it `getdata` and check Enable API Gateway CORS

##### Creating the /autocomplete mapping
1.  On the sidebar click /autocomplete
2. Click actions and select create method
3. Select `GET` from the drop down list and click the check mark
4. Type in `get-suggestions-from-input` in the Lambda Function field
5. Click Save
6. In the Settings section click the pencil next to Request Validator and select `Validate query string parameters and headers`
7. Click on method request and expand the URL Query String Parameters drop down
8. Click Add query string
9. Type input and click the check mark
10. Check required
11. Now go back and click Integration Request
12. Expand the Mapping Templates drop down
13. Click Add mapping template
14. Type `application/json` and hit the check mark
15. Click application/json and type 
```
{
  "input" : "$input.params('input')"
}
```
16. Hit save

##### Creating the /getdata mapping
1.  On the sidebar click /getdata
2. Click actions and select create method
3. Select `GET` from the drop down list and click the check mark
4. Type in `get-review-analysis` in the Lambda Function field
5. Click Save
6. In the Settings section click the pencil next to Request Validator and select `Validate query string parameters and headers`
7. Click on method request and expand the URL Query String Parameters drop down
8. Click Add query string
9. Type title and click the check mark
10. Add another query string
11. Type type and click the check mark 
12. Check required for both
13. Now go back and click Integration Request
14. Expand the Mapping Templates drop down
15. Click Add mapping template
16. Type `application/json` and hit the check mark
17. Click application/json and type 
```
{
    "title": "$input.params('title')",
    "type" : "$input.params('type')"
}
```
16. Hit save

#### Setting up the CloudWatch Trigger
1. Go to your populate-steam-applist lambda function
2. Select add trigger in the designer
3. Select `CloudWatch Events/EventBridge` from the dropdown
4. Click Create a new rule
5. Name the rule `run-2am-daily` 
6. Select Schedule expression for the rule type
7. Type `cron(0 2 * * ? *)`  in the Schedule expression field
8. Check enable trigger
9. Click add

#### Congratulations
You have now set up a fully working steam review analyzer application using AWS microservices. 
 
## Built With

* [ReactJS](https://reactjs.org/docs/getting-started.html) - The web framework used
* [npm](https://www.npmjs.com/) - Dependency Management
* [MySQL](https://www.mysql.com/) - Database
* [ExpressJS](https://expressjs.com/) - Backend Development Server


## Authors

* **Yuichi Kageyama** 
