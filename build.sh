#!/bin/bash

uname -a | grep "Darwin" 1> /dev/null

if [ $? -eq 0 ]; then
	echo "Building for mac"
	gcc -I ./libusb/libusb -I /opt/boxen/homebrew/opt/glew/include -I /opt/boxen/homebrew/opt/glfw3/include \
		-I /opt/boxen/homebrew/opt/glm/include -L /opt/boxen/homebrew/opt/glew/lib -L /opt/boxen/homebrew/opt/glfw3/lib \
		-lusb-1.0 -lglew -lglfw3 \
		-Wall -g -o \
		rygycnc main.cpp
	echo "Executable built at rygycnc"
else 
	echo "Building for windows"
	# ...
	echo "Executable built at rygycnc.exe"
fi