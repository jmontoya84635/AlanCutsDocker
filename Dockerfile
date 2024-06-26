FROM python:3
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./Django /usr/src/app

# copy entrypoint.sh
COPY ./entrypoint.sh /
ENTRYPOINT ["sh", "/entrypoint.sh"]

