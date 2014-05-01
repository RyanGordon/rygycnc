/*
 * RYGY CNC GUI and Interface application
 * Copyright © 2014 Ryan Gordon <rygorde4@sbcglobal.net>
 *
 * 
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */

#include <errno.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
using namespace glm;

#include "libusb.h"

#define VENDOR_ID 0x05ba
#define PRODUCT_ID 0x000a

static struct libusb_device_handle *devh = NULL;

static int find_rygycnc_device(void)
{
	devh = libusb_open_device_with_vid_pid(NULL, VENDOR_ID, PRODUCT_ID);
	return devh ? 0 : -EIO;
}

int main(void)
{
	GLFWwindow* window;

	if (!glfwInit()) {
		fprintf(stderr, "Failed to initialize GLFW\n");
		return -1;
	}

	window = glfwCreateWindow(640, 480, "RYGY CNC", NULL, NULL);
	if (!window) {
		fprintf(stderr, "Failed to open GLFW window.\n");
		glfwTerminate();
		return -1;
	}

	/* Make the window's context current */
	glfwMakeContextCurrent(window);

	/* Loop until the user closes the window */
	while (!glfwWindowShouldClose(window))
	{
		/* Render here */

		/* Swap front and back buffers */
		glfwSwapBuffers(window);

		/* Poll for and process events */
		glfwPollEvents();
	}

	glfwTerminate();

	return 0;
	/*libusb_device **devs;
	int r = 1;

	r = libusb_init(NULL);
	if (r < 0) {
		fprintf(stderr, "failed to initialise libusb\n");
		exit(1);
	}

	r = find_rygycnc_device();
	if (r < 0) {
		fprintf(stderr, "Could not find/open device\n");
		goto out;
	}

	r = libusb_claim_interface(devh, 0);
	if (r < 0) {
		fprintf(stderr, "usb_claim_interface error %d %s\n", r, strerror(-r));
		goto out;
	}

	printf("claimed interface\n");

	// async from here onwards

	// ...

	// exit procedures

	out_deinit:
		//libusb_free_transfer(transfer);
		set_mode(0);
		set_hwstat(0x80);
	out_release:
		libusb_release_interface(devh, 0);
	out:
		libusb_close(devh);
		libusb_exit(NULL);

	return r >= 0 ? r : -r;*/
}