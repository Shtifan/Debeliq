FROM node:20-alpine

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

WORKDIR /app/commands/other/chess_solver
COPY commands/other/chess_solver/requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY commands/other/chess_solver .

WORKDIR /app

EXPOSE 3000

CMD ["node", "index.js"]
