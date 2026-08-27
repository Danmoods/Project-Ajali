from extensions import ma
from models.media import Media

class MediaSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Media
        load_instance = True

media_schema =MediaSchema()
medias_schema = MediaSchema(many=True)
