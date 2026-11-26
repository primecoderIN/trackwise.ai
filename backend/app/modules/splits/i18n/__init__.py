"""The splits module's localized texts for people, validated at import time (splits module, i18n/)."""

from app.core.i18n import Language, define_catalog
from app.modules.splits.i18n.en import EN, SplitText
from app.modules.splits.i18n.hi import HI

define_catalog(SplitText, {Language.EN: EN, Language.HI: HI})

__all__ = ["SplitText"]
