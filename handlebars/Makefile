#
# @todo it should be possible to run the templates through lightncandy and auto-generate
# this Makefile with the metadata it calculates.
#

COMPILE=php ../maintenance/compileLightncandy.php

TOPIC_SUBTEMPLATES= flow_topic.handlebars \
		flow_topic_titlebar.handlebars \
		flow_topic_titlebar_content.handlebars \
		flow_topic_titlebar_close.handlebars \
		flow_reply_form.handlebars \
		flow_topiclist_loop.handlebars \
		flow_load_more.handlebars \
		flow_errors.handlebars \
		flow_preview_button.handlebars

all: compiled/flow_block_header.handlebars.php \
		compiled/flow_block_header_edit.handlebars.php \
		compiled/flow_block_header_single_view.handlebars.php \
		compiled/flow_block_header_diff_view.handlebars.php \
		compiled/flow_board_collapsers_subcomponent.handlebars.php \
		compiled/flow_block_topiclist.handlebars.php \
		compiled/flow_block_topic.handlebars.php \
		compiled/flow_block_topic_history.handlebars.php \
		compiled/flow_block_topic_single_view.handlebars.php \
		compiled/flow_block_topic_diff_view.handlebars.php \
		compiled/flow_block_topic_close.handlebars.php \
		compiled/flow_block_topic_reply.handlebars.php \
		compiled/flow_block_topic_edit_post.handlebars.php \
		compiled/flow_block_topic_edit_title.handlebars.php \
		compiled/flow_block_topic_moderate_topic.handlebars.php \
		compiled/flow_block_topic_moderate_post.handlebars.php \
		compiled/flow_block_board-history.handlebars.php \
		compiled/flow_block_topicsummary_close.handlebars.php \
		compiled/flow_block_topicsummary_edit.handlebars.php \
		compiled/flow_block_topicsummary_single_view.handlebars.php \
		compiled/flow_block_topicsummary_diff_view.handlebars.php \
		compiled/flow_board.handlebars.php \
		compiled/flow_preview_button.handlebars.php \
		compiled/flow_post.handlebars.php \
		compiled/flow_tooltip.handlebars.php \
		compiled/timestamp.handlebars.php

compiled/flow_block_header.handlebars.php: \
		flow_block_header.handlebars
	$(COMPILE) flow_block_header

compiled/flow_block_header_edit.handlebars.php: \
		flow_block_header_edit.handlebars \
		flow_errors.handlebars
	$(COMPILE) flow_block_header_edit

compiled/flow_block_header_single_view.handlebars.php: \
		flow_block_header_single_view.handlebars
	$(COMPILE) flow_block_header_single_view

compiled/flow_block_header_diff_view.handlebars.php: \
		flow_block_header_diff_view.handlebars
	$(COMPILE) flow_block_header_diff_view

compiled/flow_block_topicsummary_close.handlebars.php: \
		flow_block_topicsummary_close.handlebars \
		flow_errors.handlebars
	$(COMPILE) flow_block_topicsummary_close

compiled/flow_block_topicsummary_edit.handlebars.php: \
		flow_block_topicsummary_edit.handlebars \
		flow_errors.handlebars \
		flow_preview_button.handlebars
	$(COMPILE) flow_block_topicsummary_edit

compiled/flow_block_topicsummary_single_view.handlebars.php: \
		flow_block_topicsummary_single_view.handlebars
	$(COMPILE) flow_block_topicsummary_single_view

compiled/flow_block_topicsummary_diff_view.handlebars.php: \
		flow_block_topicsummary_diff_view.handlebars
	$(COMPILE) flow_block_topicsummary_diff_view

compiled/flow_board_collapsers_subcomponent.handlebars.php: \
		flow_board_collapsers_subcomponent.handlebars
	$(COMPILE) flow_board_collapsers_subcomponent

compiled/flow_block_topiclist.handlebars.php: \
		flow_block_topiclist.handlebars \
		flow_board_navigation.handlebars \
		flow_topic_navigation.handlebars \
		flow_newtopic_form.handlebars \
		flow_anon_warning.handlebars \
		flow_tooltip.handlebars \
		$(TOPIC_SUBTEMPLATES)
	$(COMPILE) flow_block_topiclist

compiled/flow_block_topic.handlebars.php: \
		flow_block_topic.handlebars \
		$(TOPIC_SUBTEMPLATES)
	$(COMPILE) flow_block_topic

compiled/flow_block_topic_history.handlebars.php: \
		flow_block_topic_history.handlebars
	$(COMPILE) flow_block_topic_history

compiled/flow_block_topic_single_view.handlebars.php: \
		flow_block_topic_single_view.handlebars \
		$(TOPIC_SUBTEMPLATES)
	$(COMPILE) flow_block_topic_single_view

compiled/flow_block_topic_diff_view.handlebars.php: \
		flow_block_topic_diff_view.handlebars \
		$(TOPIC_SUBTEMPLATES)
	$(COMPILE) flow_block_topic_diff_view

compiled/flow_block_topic_close.handlebars.php: \
		flow_block_topic_close.handlebars
	$(COMPILE) flow_block_topic_close

compiled/flow_topic_titlebar_close.handlebars.php: \
		flow_block_topic_titlebar_close.handlebars
	$(COMPILE) flow_block_topic_close

compiled/flow_block_topic_reply.handlebars.php: \
		flow_block_topic_reply.handlebars \
		flow_errors.handlebars \
		flow_reply_form.handlebars \
		flow_anon_warning.handlebars \
		flow_tooltip.handlebars
	$(COMPILE) flow_block_topic_reply

compiled/flow_block_topic_edit_post.handlebars.php: \
		flow_block_topic_edit_post.handlebars \
		flow_errors.handlebars \
		flow_edit_post.handlebars \
		flow_anon_warning.handlebars \
		flow_tooltip.handlebars
	$(COMPILE) flow_block_topic_edit_post

compiled/flow_block_topic_edit_title.handlebars.php: \
		flow_block_topic_edit_title.handlebars \
		flow_errors.handlebars \
		flow_edit_topic_title.handlebars \
		flow_edit_post.handlebars \
		flow_anon_warning.handlebars \
		flow_tooltip.handlebars
	$(COMPILE) flow_block_topic_edit_title

compiled/flow_block_topic_moderate_post.handlebars.php: \
		flow_block_topic_moderate_post.handlebars \
		flow_errors.handlebars \
		flow_moderate_post.handlebars \
		flow_post.handlebars
	$(COMPILE) flow_block_topic_moderate_post

compiled/flow_block_topic_moderate_topic.handlebars.php: \
		flow_block_topic_moderate_topic.handlebars \
		flow_errors.handlebars \
		flow_moderate_topic.handlebars \
		$(TOPIC_SUBTEMPLATES)
	$(COMPILE) flow_block_topic_moderate_topic

compiled/flow_block_board-history.handlebars.php: \
		flow_block_board-history.handlebars
	$(COMPILE) flow_block_board-history

compiled/flow_board.handlebars.php: \
		flow_board.handlebars \
		flow_block_loop.handlebars
	$(COMPILE) flow_board

compiled/flow_preview_button.handlebars.php: \
		flow_preview_button.handlebars
	$(COMPILE) flow_preview_button

compiled/flow_post.handlebars.php: \
		flow_post.handlebars
	$(COMPILE) flow_post

compiled/flow_tooltip.handlebars.php: \
		flow_tooltip.handlebars
	$(COMPILE) flow_tooltip

compiled/timestamp.handlebars.php: \
		timestamp.handlebars
	$(COMPILE) timestamp