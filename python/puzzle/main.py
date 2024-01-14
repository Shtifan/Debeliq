import cv2
import numpy as np

def find_and_mark_puzzle_pieces(image_path, output_path):
    # Read the image
    image = cv2.imread(image_path)

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply GaussianBlur to reduce noise and help contour detection
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Use Canny edge detector to find edges
    edges = cv2.Canny(blurred, 50, 150)

    # Find contours in the edged image
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Draw contours around the detected puzzle pieces
    cv2.drawContours(image, contours, -1, (0, 255, 0), 2)

    # Save the marked image
    cv2.imwrite(output_path, image)

find_and_mark_puzzle_pieces('./python/puzzle/image.png', './python/puzzle/output.png')
