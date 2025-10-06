## AI Anthropic Claude with Nodejs(Ts) and Guard Rails

A example of how we can connect with anthropic claude with nodejs(typescript) and how we can create some types of guard rails for  protect our app of alucination



![Claude](https://img.shields.io/badge/Claude-AI-CC785C?style=for-the-badge&logoColor=white) <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHJT7ju9w4Z4OAXiawqG9HhvDLVCx_ZgYNLdLWbjxgCMM_EAaHTu-V58kVeudZEntq7DU&usqp=CAU" alt="Claude AI" width="28" height="28"/>
![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?style=for-the-badge&logoColor=white) <img src="https://s3.amazonaws.com/appforest_uf/f1679157815668x357855949495047500/io6cC6vZ_400x400.png" alt="Claude AI" width="28" height="28"/>
![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.x-3178C6?logo=typescript&logoColor=white&style=for-the-badge)

### First, we need export our anthropic api key as an environment variable

```
export ANTHROPIC_API_KEY='my_anthropic_api_key'

```


### Install Dependecies from package.json

```
npm install

```


### We have three exmaples here:

1. **guard_rails_prompt_engineering.ts =>** This example shows how we connect, config a guard rails with prompt engieering and retrieve response from Anthropic Claude with type to format output json.

2. **guard_rails_alucination.ts =>**  This example shows how we make a guard-rails type to protect our app from alucination

3. **guard_rails_confidence.ts =>** This example shows how we make a guard-rails type to protect our app from alucination based on confidence score defined by us

To execute the examples, execute:

1.
```
npx tsx guard_rails_prompt_engineering.ts 
```

2.
```
npx tsx guard_rails_alucination.ts 
```

3.
```
npx tsx guard_rails_confidence.ts
```