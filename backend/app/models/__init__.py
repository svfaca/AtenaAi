# Import all models so SQLAlchemy can resolve string-based relationships
from app.models.user import User, UserRole  # noqa: F401
from app.models.conversation import Conversation  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.classroom import Classroom, classroom_students, pending_classroom_students  # noqa: F401
from app.models.classroom_member import ClassroomMember, ClassroomMemberRole  # noqa: F401
from app.models.student_report import StudentReport  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.group_message import GroupMessage  # noqa: F401
