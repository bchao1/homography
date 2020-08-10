import numpy as np
import cv2
from PIL import Image
import matplotlib.pyplot as plt 

canvas = np.array(Image.open('../data/times_square.jpg'))

def onclick(event):
    ix, iy = event.xdata, event.ydata
    print(iy, ix)

fig = plt.figure()
cid = fig.canvas.mpl_connect('button_press_event', onclick)
plt.imshow(canvas)
plt.show()