FROM node:20-bullseye

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN pip3 install --no-cache-dir -r ./commands/other/chess_solver/requirements.txt

CMD ["npm", "start"]
