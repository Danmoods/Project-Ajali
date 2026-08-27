from extensions import ma
from models.community_post import CommunityPost

class CommunityPostSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = CommunityPost
        load_instance = True

communitypost_schema=CommunityPostSchema()
communityposts_schema=CommunityPostSchema(many=True)