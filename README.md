Dedocker
==================
> A tool for get docker images in the Filecoin Network.


## Init
```sh
sudo apt install libhwloc-dev -y 

sudo apt install ocl-icd-opencl-dev -y

git clone git@git.haonengyun.com:sunzhaojian/dedocker-command.git

cd dedocker-command

npm install . -g  # or  npm install && npm link
```

## Usage

Get help:
```sh
dedocker  --help
```
Search image

```sh
dedocker search [images]

dedocker search [images]:[version] 
```
Pull image
```sh
dedocker pull [images]:[version] 
```


