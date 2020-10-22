import AuthRequest from "../../../../type/AuthRequest";
import { Response } from "express";
import { getRepository } from "typeorm";
import Post from "../../../../entity/Post";
import logger from "../../../../lib/logger";
import User from "../../../../entity/User";
import PostCommentType from "../../../../type/PostCommentType";
import Comment from "../../../../entity/Comment";
import Reply from "../../../../entity/Reply";

export default async (req: AuthRequest, res: Response) => {
  const user: User = req.user;
  const idx: number = Number(req.params.idx);

  if (isNaN(idx)) {
    logger.yellow("[GET] 검증 오류. idx is NaN");
    res.status(400).json({
      status: 400,
      message: "검증 오류.",
    });
    return;
  }

  try {
    const postRepo = getRepository(Post);
    const post: PostCommentType = await postRepo.findOne({
      where: {
        idx,
      },
    });

    if (!post) {
      logger.yellow("[GET] 글 없음.");
      res.status(404).json({
        status: 404,
        message: "글 없음.",
      });
      return;
    }

    if (post.is_temp) {
      if (!user || !user.is_admin) {
        logger.yellow("[GET] 권한 없음.");
        res.status(403).json({
          status: 403,
          message: "권한 없음.",
        });
        return;
      }
    }

    let total_count: number = 0;

    const commentRepo = getRepository(Comment);
    const [comments, comment_count] = await commentRepo.findAndCount({
      where: {
        post: post,
      },
    });

    //total_count에는 글의 모든 댓글과 답글 수를 할당해야해뇨~
    total_count += comment_count;
    for (let i in comments) {
      const replyRepo = getRepository(Reply);
      const reply_count = await replyRepo.count({
        where: {
          comment: comments[i],
        },
      });
      total_count += reply_count;
    }
    post.comment_count = total_count;

    logger.green("[GET] 글 조회 성공.");
    res.status(200).json({
      status: 200,
      message: "글 조회 성공.",
      data: {
        post,
      },
    });
  } catch (error) {
    logger.red("[GET] 글 조회 서버 오류.", error.message);
    res.status(500).json({
      status: 500,
      message: "서버 오류.",
    });
    return;
  }
};
