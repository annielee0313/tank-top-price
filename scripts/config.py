"""Every modelling assumption lives here, with its citation.

The methodology page quotes this file, so change a number here (with a source)
rather than anywhere else.
"""

# Fabric used by one basic tank. The story uses the base value; tooltips show
# the high value as an upper bound.
YARDS_BASE = 1.0
YARDS_HIGH = 1.5
YARDS_SOURCE = "TODO: cite a pattern-yield / marker-efficiency reference"

# Standard allowed minutes (SAM): sewing time for one basic sleeveless knit top.
# Labor is the most assumption-heavy number in the piece, so it is always shown
# as a range. TODO: replace with a cited value before publishing.
SAM_MINUTES_LOW = 8
SAM_MINUTES_BASE = 10
SAM_MINUTES_HIGH = 15
SAM_SOURCE = "TODO: cite an apparel-engineering SAM table or published costing breakdown"

# Standard hours in a work month, used to turn monthly wages into hourly ones.
HOURS_PER_MONTH = 173
