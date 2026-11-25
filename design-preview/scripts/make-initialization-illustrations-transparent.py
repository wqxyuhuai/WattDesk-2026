from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1] / "home-assets" / "inverter-settings" / "setup"
MAX_SIZE = (2084, 851)


def remove_connected_white_background(source: Path) -> Path:
    image = Image.open(source).convert("RGB")
    image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

    background = Image.new("L", image.size, 0)
    source_pixels = image.load()
    mask_pixels = background.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue = source_pixels[x, y]
            if min(red, green, blue) >= 246 and max(red, green, blue) - min(red, green, blue) <= 6:
                mask_pixels[x, y] = 255

    ImageDraw.floodfill(background, (0, 0), 128, thresh=0)
    alpha = background.point(lambda value: 0 if value == 128 else 255)

    output = image.convert("RGBA")
    output.putalpha(alpha)
    target = source.with_suffix(".png")
    output.save(target, optimize=True)
    return target


if __name__ == "__main__":
    for source in sorted(ROOT.glob("*.jpg")):
        target = remove_connected_white_background(source)
        print(f"{target.name}: {target.stat().st_size} bytes")
